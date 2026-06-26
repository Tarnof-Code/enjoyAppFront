import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { ListeAccordion, listeAccordionStyles } from '../../Components/ListeAccordion';
import SortieEnfantsParticipantsModal from '../../Components/SortieEnfantsParticipantsModal';
import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { jourISOdepuisValeurApi } from '../../helpers/dateApi';
import {
  idsEnfantsDejaAffectesAutreEvenement,
  idsEnfantsSelectionInitialeSortie,
} from '../../helpers/activiteUtils';
import { datePrestataireVersYmd } from '../../helpers/activitePrestataireCalendrier';
import { getUserFacingErrorMessage } from '../../helpers/axiosError';
import { activiteService } from '../../services/activite.service';
import { activitePrestataireService } from '../../services/activitePrestataire.service';
import { enfantService } from '../../services/enfant.service';
import { groupeService } from '../../services/groupe.service';
import { momentService } from '../../services/moment.service';
import type { ActiviteDto, ActivitePrestataireDto, EnfantDto, GroupeDto, MomentDto } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors } from '../../config/theme';

dayjs.locale('fr');

const FILTRE_DATE_TOUTES = '';

function normaliserSortie(p: ActivitePrestataireDto): ActivitePrestataireDto {
  return {
    ...p,
    groupeIds: p.groupeIds ?? [],
    moments: p.moments ?? [],
    enfants: p.enfants ?? [],
    nonParticipations: p.nonParticipations ?? [],
  };
}

function premierOrdre(sortie: ActivitePrestataireDto): number {
  return sortie.moments?.[0]?.ordre ?? 0;
}

function trierSorties(sorties: ActivitePrestataireDto[]): ActivitePrestataireDto[] {
  return [...sorties].sort((a, b) => {
    const ja = jourISOdepuisValeurApi(a.date as unknown) ?? '';
    const jb = jourISOdepuisValeurApi(b.date as unknown) ?? '';
    const cmp = ja.localeCompare(jb);
    if (cmp !== 0) return cmp;
    return premierOrdre(a) - premierOrdre(b);
  });
}

function horaires(sortie: ActivitePrestataireDto): string | null {
  if (sortie.heureDepart && sortie.heureRetour) {
    return `${sortie.heureDepart} → ${sortie.heureRetour}`;
  }
  if (sortie.heureDepart) return `Départ : ${sortie.heureDepart}`;
  if (sortie.heureRetour) return `Retour : ${sortie.heureRetour}`;
  return null;
}

function libelleDateSortie(date: ActivitePrestataireDto['date']): string | null {
  const jour = jourISOdepuisValeurApi(date as unknown);
  return jour ? dayjs(jour).format('dddd D MMMM') : null;
}

function Liste() {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejourId = sejour?.id;
  const [sorties, setSorties] = useState<ActivitePrestataireDto[]>([]);
  const [groupesListe, setGroupesListe] = useState<GroupeDto[]>([]);
  const [enfants, setEnfants] = useState<EnfantDto[]>([]);
  const [activitesInternes, setActivitesInternes] = useState<ActiviteDto[]>([]);
  const [moments, setMoments] = useState<MomentDto[]>([]);

  const [ouverts, setOuverts] = useState<Set<number>>(() => new Set());
  const [filtreDate, setFiltreDate] = useState(FILTRE_DATE_TOUTES);
  const [groupesSelectionnes, setGroupesSelectionnes] = useState<string[]>([]);

  const [enfantsModalVisible, setEnfantsModalVisible] = useState(false);
  const [sortieEnfantsCible, setSortieEnfantsCible] = useState<ActivitePrestataireDto | null>(null);
  const [enfantsSelection, setEnfantsSelection] = useState<Set<number>>(() => new Set());
  const [enfantsModalChargement, setEnfantsModalChargement] = useState(false);
  const [enfantsModalSubmitting, setEnfantsModalSubmitting] = useState(false);
  const [enfantsModalError, setEnfantsModalError] = useState<string | null>(null);

  const executer = useCallback(async () => {
    if (sejourId == null) return;
    const [sortiesResult, groupesResult, enfantsResult, activitesResult, momentsResult] =
      await Promise.allSettled([
        activitePrestataireService.getActivitesPrestatairesBySejour(sejourId),
        groupeService.getGroupesBySejour(sejourId),
        enfantService.getEnfantsBySejour(sejourId),
        activiteService.getActivitesBySejour(sejourId),
        momentService.getMomentsBySejour(sejourId),
      ]);
    if (sortiesResult.status === 'rejected') {
      throw sortiesResult.reason;
    }
    setSorties(sortiesResult.value.map(normaliserSortie));
    if (groupesResult.status === 'fulfilled') {
      setGroupesListe(groupesResult.value);
    }
    if (enfantsResult.status === 'fulfilled') {
      setEnfants(enfantsResult.value);
    }
    if (activitesResult.status === 'fulfilled') {
      setActivitesInternes(activitesResult.value);
    }
    if (momentsResult.status === 'fulfilled') {
      setMoments(momentsResult.value);
    }
  }, [sejourId]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les sorties.',
  );

  const datesAvecSorties = useMemo(() => {
    const ymds = new Set<string>();
    for (const s of sorties) {
      const ymd = datePrestataireVersYmd(s.date);
      if (ymd) ymds.add(ymd);
    }
    return [...ymds]
      .sort((a, b) => a.localeCompare(b))
      .map((ymd) => ({
        value: ymd,
        label: dayjs(ymd).format('dddd D MMMM'),
      }));
  }, [sorties]);

  const optionsDate = useMemo(
    () => [{ value: FILTRE_DATE_TOUTES, label: 'Toutes les dates' }, ...datesAvecSorties],
    [datesAvecSorties],
  );

  const groupesAvecSorties = useMemo(() => {
    const ids = new Set<number>();
    for (const s of sorties) {
      for (const id of s.groupeIds ?? []) ids.add(id);
    }
    return [...groupesListe]
      .filter((g) => ids.has(g.id))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))
      .map((g) => ({ label: g.nom, value: String(g.id) }));
  }, [sorties, groupesListe]);

  useEffect(() => {
    if (filtreDate && !datesAvecSorties.some((d) => d.value === filtreDate)) {
      setFiltreDate(FILTRE_DATE_TOUTES);
    }
  }, [filtreDate, datesAvecSorties]);

  useEffect(() => {
    const valides = new Set(groupesAvecSorties.map((g) => g.value));
    setGroupesSelectionnes((prev) => {
      const next = prev.filter((id) => valides.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [groupesAvecSorties]);

  const groupesFiltreIds = useMemo(
    () => new Set(groupesSelectionnes.map((id) => Number(id)).filter((id) => Number.isFinite(id))),
    [groupesSelectionnes],
  );

  const sortiesAffichees = useMemo(() => {
    let filtrées = sorties;
    if (filtreDate) {
      filtrées = filtrées.filter((s) => datePrestataireVersYmd(s.date) === filtreDate);
    }
    if (groupesFiltreIds.size > 0) {
      filtrées = filtrées.filter((s) =>
        (s.groupeIds ?? []).some((gid) => groupesFiltreIds.has(gid)),
      );
    }
    return trierSorties(filtrées);
  }, [sorties, filtreDate, groupesFiltreIds]);

  const filtresActifs = filtreDate !== FILTRE_DATE_TOUTES || groupesSelectionnes.length > 0;

  const reinitialiserFiltres = () => {
    setFiltreDate(FILTRE_DATE_TOUTES);
    setGroupesSelectionnes([]);
  };

  const basculerSortie = (sortieId: number) => {
    setOuverts((prev) => {
      const next = new Set(prev);
      if (next.has(sortieId)) next.delete(sortieId);
      else next.add(sortieId);
      return next;
    });
  };

  const fermerModalEnfants = () => {
    if (enfantsModalSubmitting) return;
    setEnfantsModalVisible(false);
    setSortieEnfantsCible(null);
    setEnfantsSelection(new Set());
    setEnfantsModalError(null);
    setEnfantsModalChargement(false);
  };

  const ouvrirModalEnfants = (sortie: ActivitePrestataireDto) => {
    if (sejourId == null || sejour == null) return;
    setEnfantsModalError(null);
    setEnfantsModalChargement(true);
    setEnfantsModalVisible(true);
    setSortieEnfantsCible(sortie);
    setEnfantsSelection(new Set(idsEnfantsSelectionInitialeSortie(sortie, groupesListe, sejour)));

    void (async () => {
      try {
        const fraiche = await activitePrestataireService.getActivitePrestataireById(sejourId, sortie.id);
        const normalisee = normaliserSortie(fraiche);
        setSortieEnfantsCible(normalisee);
        setEnfantsSelection(
          new Set(idsEnfantsSelectionInitialeSortie(normalisee, groupesListe, sejour)),
        );
      } catch (err: unknown) {
        setEnfantsModalError(
          getUserFacingErrorMessage(err, 'Impossible de charger les enfants participants'),
        );
      } finally {
        setEnfantsModalChargement(false);
      }
    })();
  };

  const toggleEnfantModal = (enfantId: number) => {
    setEnfantsSelection((prev) => {
      const next = new Set(prev);
      if (next.has(enfantId)) next.delete(enfantId);
      else next.add(enfantId);
      return next;
    });
  };

  const enregistrerEnfantsSortie = async () => {
    if (!sortieEnfantsCible || sejourId == null) return;
    setEnfantsModalError(null);

    const enfantIds = [...enfantsSelection].sort((a, b) => a - b);
    const momentIds = (sortieEnfantsCible.moments ?? []).map((m) => m.id);
    if (momentIds.length > 0) {
      const conflits = idsEnfantsDejaAffectesAutreEvenement(
        activitesInternes,
        sorties,
        datePrestataireVersYmd(sortieEnfantsCible.date),
        momentIds,
        moments,
        { excludePrestataireId: sortieEnfantsCible.id },
      );
      for (const enfantId of enfantIds) {
        const conflit = conflits.get(enfantId);
        if (!conflit) continue;
        const enfant = enfants.find((e) => e.id === enfantId);
        const prenom = enfant?.prenom?.trim() || "L'enfant";
        setEnfantsModalError(
          `${prenom} participe déjà à « ${conflit.activiteNom} » le même jour au moment « ${conflit.momentNom} ».`,
        );
        return;
      }
    }

    setEnfantsModalSubmitting(true);
    try {
      const updated = await activitePrestataireService.modifierEnfantsActivitePrestataire(
        sejourId,
        sortieEnfantsCible.id,
        { enfantIds },
      );
      const normalisee = normaliserSortie(updated);
      setSorties((prev) => prev.map((s) => (s.id === normalisee.id ? normalisee : s)));
      fermerModalEnfants();
    } catch (err: unknown) {
      setEnfantsModalError(
        getUserFacingErrorMessage(err, 'Impossible d’enregistrer les enfants participants'),
      );
    } finally {
      setEnfantsModalSubmitting(false);
    }
  };

  if (!sejourId || !sejour) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Aucun séjour sélectionné.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const barreFiltres =
    sorties.length > 0 && (datesAvecSorties.length > 0 || groupesAvecSorties.length > 0) ? (
    <View style={styles.barreFiltres}>
      {datesAvecSorties.length > 0 ? (
        <Dropdown
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          placeholderStyle={styles.dropdownTexte}
          selectedTextStyle={styles.dropdownTexte}
          itemTextStyle={styles.dropdownItemTexte}
          activeColor={colors.primarySoft}
          data={optionsDate}
          labelField="label"
          valueField="value"
          value={filtreDate}
          onChange={(item) => setFiltreDate(item.value)}
          placeholder="Date"
          renderItem={(item, selected) => (
            <View style={styles.dropdownItem}>
              {selected ? (
                <MaterialIcons name="check" size={18} color={colors.primary} />
              ) : (
                <View style={styles.dropdownItemSpacer} />
              )}
              <Text style={styles.dropdownItemTexte}>{item.label}</Text>
            </View>
          )}
        />
      ) : null}

      {groupesAvecSorties.length > 0 ? (
        <MultiSelect
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          placeholderStyle={styles.dropdownTexte}
          selectedTextStyle={styles.dropdownTexte}
          itemTextStyle={styles.dropdownItemTexte}
          activeColor={colors.primarySoft}
          data={groupesAvecSorties}
          labelField="label"
          valueField="value"
          value={groupesSelectionnes}
          onChange={setGroupesSelectionnes}
          placeholder={
            groupesSelectionnes.length > 0
              ? `${groupesSelectionnes.length} groupe${groupesSelectionnes.length > 1 ? 's' : ''}`
              : 'Groupes'
          }
          visibleSelectedItem={false}
          renderItem={(item, selected) => (
            <View style={styles.dropdownItem}>
              <MaterialIcons
                name={selected ? 'check-box' : 'check-box-outline-blank'}
                size={18}
                color={selected ? colors.primary : colors.muted}
              />
              <Text style={styles.dropdownItemTexte}>{item.label}</Text>
            </View>
          )}
        />
      ) : null}

      {filtresActifs ? (
        <Pressable
          onPress={reinitialiserFiltres}
          style={({ pressed }) => [styles.btnReinitialiser, pressed && styles.btnReinitialiserPressed]}
        >
          <Text style={styles.btnReinitialiserTexte}>Réinitialiser</Text>
        </Pressable>
      ) : null}
    </View>
  ) : null;

  return (
    <>
      <FlatList
        data={sortiesAffichees}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={barreFiltres}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => {
          const nomsMoments = (item.moments ?? []).map((m) => m.nom).filter(Boolean);
          const nomsGroupes = (item.groupeIds ?? [])
            .map((id) => groupesListe.find((g) => g.id === id)?.nom)
            .filter((v): v is string => !!v);
          const plage = horaires(item);
          const libelleDate = libelleDateSortie(item.date);

          return (
            <ListeAccordion
              ouvert={ouverts.has(item.id)}
              onToggle={() => basculerSortie(item.id)}
              entete={
                <>
                  <View style={listeAccordionStyles.ligneTitre}>
                    <Text style={listeAccordionStyles.titre} numberOfLines={2}>
                      {item.nom}
                    </Text>
                    {nomsMoments.length > 0 ? (
                      <Text style={listeAccordionStyles.badge} numberOfLines={2}>
                        {nomsMoments.join(', ')}
                      </Text>
                    ) : null}
                  </View>
                  {libelleDate ? (
                    <Text style={[listeAccordionStyles.sousTitre, styles.dateAccordeon]} numberOfLines={1}>
                      {libelleDate}
                    </Text>
                  ) : null}
                </>
              }
              corps={
                <>
                  {plage ? <Text style={styles.ligne}>Horaires : {plage}</Text> : null}
                  {nomsGroupes.length > 0 ? (
                    <Text style={styles.ligne}>Groupes : {nomsGroupes.join(', ')}</Text>
                  ) : null}
                  {item.informations ? (
                    <Text style={styles.description}>{item.informations}</Text>
                  ) : null}
                  {item.telephone ? (
                    <Text
                      style={styles.lien}
                      onPress={() => Linking.openURL(`tel:${item.telephone}`)}
                    >
                      {item.telephone}
                    </Text>
                  ) : null}
                  <Pressable
                    onPress={() => ouvrirModalEnfants(item)}
                    disabled={enfantsModalSubmitting}
                    style={({ pressed }) => [
                      styles.btnParticipants,
                      pressed && styles.btnParticipantsPressed,
                    ]}
                  >
                    <Text style={styles.btnParticipantsTexte}>Gérer les participants</Text>
                  </Pressable>
                </>
              }
            />
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {sorties.length === 0
              ? 'Aucune sortie pour ce séjour.'
              : 'Aucune sortie ne correspond aux filtres.'}
          </Text>
        }
      />

      <SortieEnfantsParticipantsModal
        visible={enfantsModalVisible}
        sejour={sejour}
        sortie={sortieEnfantsCible}
        groupes={groupesListe}
        enfantsDuSejour={enfants}
        activitesInternes={activitesInternes}
        activitesPrestataires={sorties}
        moments={moments}
        selectedEnfantIds={enfantsSelection}
        chargement={enfantsModalChargement}
        submitting={enfantsModalSubmitting}
        error={enfantsModalError}
        onToggleEnfant={toggleEnfantModal}
        onFermer={fermerModalEnfants}
        onEnregistrer={enregistrerEnfantsSortie}
      />
    </>
  );
}

export default function Sorties() {
  return <Liste />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  list: {
    padding: 12,
    paddingBottom: 24,
    backgroundColor: colors.surface,
  },
  barreFiltres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dropdown: {
    flex: 1,
    minWidth: 140,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dropdownContainer: {
    borderRadius: 10,
  },
  dropdownTexte: {
    fontSize: 14,
    color: colors.text,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemSpacer: {
    width: 18,
  },
  dropdownItemTexte: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  btnReinitialiser: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnReinitialiserPressed: {
    opacity: 0.85,
  },
  btnReinitialiserTexte: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  dateAccordeon: {
    textTransform: 'capitalize',
    color: colors.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
  },
  ligne: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  lien: {
    fontSize: 14,
    color: colors.link,
    fontWeight: '600',
    marginTop: 6,
  },
  btnParticipants: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnParticipantsPressed: {
    opacity: 0.85,
  },
  btnParticipantsTexte: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 24,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
