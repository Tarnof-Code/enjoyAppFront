import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { useRafraichirSejourCourant } from '../../hooks/useRafraichirSejourCourant';
import { cahierInfirmerieService } from '../../services/cahierInfirmerie.service';
import { enfantService } from '../../services/enfant.service';
import { useAppSelector } from '../../store/hooks';
import { dayjsDepuisValeurApi } from '../../helpers/dateApi';
import { getUserFacingErrorMessage } from '../../helpers/axiosError';
import {
  libelleEnfantDuSejour,
  libelleEquipeDuSejour,
} from '../../helpers/triListesSejour';
import {
  peutModifierEntreeCahierInfirmerie,
  peutSupprimerEntreeCahierInfirmerie,
} from '../../helpers/droitsCahierInfirmerie';
import { LIBELLE_APPEL, LIBELLE_SOIN } from '../../constants/cahierInfirmerieLabels';
import { colors, fontSizes, radius, spacing } from '../../config/theme';
import { ListeAccordion, listeAccordionStyles } from '../../Components/ListeAccordion';
import ListeEcranLayout from '../../Components/ListeEcranLayout';
import CahierInfirmerieFormModal, {
  type EnfantOptionCahier,
  type MembreSoigneurOption,
} from '../../Components/CahierInfirmerieFormModal';
import type {
  CahierInfirmerieEntreeDto,
  EnfantDto,
  SaveCahierInfirmerieEntreeRequest,
  SejourDTO,
} from '../../types/api';

dayjs.locale('fr');

function formaterTemperature(celsius: number): string {
  return `${celsius.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} °C`;
}

function libelleSoins(e: CahierInfirmerieEntreeDto): string {
  const precisionAutre = e.soinsAutrePrecision?.trim();
  const parts = [...(e.soins ?? [])].sort().map((s) => {
    if (s === 'AUTRE') return precisionAutre || LIBELLE_SOIN.AUTRE;
    const lib = LIBELLE_SOIN[s] ?? s;
    if (s === 'PRISE_TEMPERATURE' && e.temperatureCelsius != null) {
      return `${lib} (${formaterTemperature(e.temperatureCelsius)})`;
    }
    return lib;
  });
  return parts.length ? parts.join(', ') : '—';
}

function libelleAppels(e: CahierInfirmerieEntreeDto): string {
  const precisionAutre = e.appelAutrePrecision?.trim();
  const parts = [...(e.appels ?? [])].sort().map((a) => {
    if (a === 'AUTRE') return precisionAutre || LIBELLE_APPEL.AUTRE;
    return LIBELLE_APPEL[a] ?? a;
  });
  return parts.length ? parts.join(', ') : '';
}

function joursAvecEntrees(entrees: CahierInfirmerieEntreeDto[]): { value: string; label: string }[] {
  const dates = new Set<string>();
  for (const e of entrees) {
    const j = dayjsDepuisValeurApi(e.dateHeure);
    if (j.isValid()) dates.add(j.format('YYYY-MM-DD'));
  }
  return [...dates]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => {
      const label = dayjs(value).format('dddd D MMMM YYYY');
      return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
    });
}

function membresEligiblesSoigneur(sejour: SejourDTO): MembreSoigneurOption[] {
  const seen = new Set<string>();
  const out: MembreSoigneurOption[] = [];
  const add = (tokenId?: string, nom?: string, prenom?: string) => {
    const t = tokenId?.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push({ tokenId: t, nom: nom ?? '', prenom: prenom ?? '' });
  };
  add(sejour.directeur?.tokenId, sejour.directeur?.nom, sejour.directeur?.prenom);
  for (const m of sejour.equipe ?? []) add(m.tokenId, m.nom, m.prenom);
  return out;
}

function normaliser(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

export default function CahierInfirmerie() {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejourId = sejour?.id;
  const tokenUtilisateur = useAppSelector((state) => state.auth.tokenId);
  const prenomConnecte = useAppSelector((state) => state.auth.prenom);
  const roleGlobal = useAppSelector((state) => state.auth.role);
  const rafraichirSejour = useRafraichirSejourCourant();

  const [entrees, setEntrees] = useState<CahierInfirmerieEntreeDto[]>([]);
  const [enfants, setEnfants] = useState<EnfantDto[]>([]);
  const [recherche, setRecherche] = useState('');
  const [jourFiltre, setJourFiltre] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [entreeEdition, setEntreeEdition] = useState<CahierInfirmerieEntreeDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [erreurModal, setErreurModal] = useState<string | null>(null);
  const [ouverts, setOuverts] = useState<Set<number>>(() => new Set());

  const executer = useCallback(async () => {
    if (sejourId == null) return;
    const [, listeEntrees, listeEnfants] = await Promise.all([
      rafraichirSejour(),
      cahierInfirmerieService.listerEntrees(sejourId),
      enfantService.getEnfantsBySejour(sejourId).catch(() => [] as EnfantDto[]),
    ]);
    setEntrees(listeEntrees);
    setEnfants(listeEnfants);
  }, [sejourId, rafraichirSejour]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    "Impossible de charger le cahier d'infirmerie.",
  );

  const optionsJours = useMemo(() => {
    const jours = joursAvecEntrees(entrees);
    if (jours.length === 0) return [];
    return [{ value: '', label: 'Tous les jours' }, ...jours];
  }, [entrees]);

  useEffect(() => {
    if (jourFiltre && !optionsJours.some((o) => o.value === jourFiltre)) {
      setJourFiltre('');
    }
  }, [jourFiltre, optionsJours]);

  const enfantsOptions = useMemo<EnfantOptionCahier[]>(
    () => enfants.map((e) => ({ id: e.id, prenom: e.prenom, nom: e.nom })),
    [enfants],
  );

  const soigneursOptions = useMemo<MembreSoigneurOption[]>(() => {
    if (!sejour) return [];
    const base = membresEligiblesSoigneur(sejour);
    const tid = (tokenUtilisateur ?? '').trim();
    if (tid && !base.some((m) => m.tokenId === tid)) {
      base.push({ tokenId: tid, nom: '', prenom: (prenomConnecte ?? '').trim() || '—' });
    }
    return base;
  }, [sejour, tokenUtilisateur, prenomConnecte]);

  const entreesVisibles = useMemo(() => {
    const terme = normaliser(recherche);
    return entrees.filter((e) => {
      if (jourFiltre) {
        const j = dayjsDepuisValeurApi(e.dateHeure);
        if (!j.isValid() || j.format('YYYY-MM-DD') !== jourFiltre) return false;
      }
      if (!terme) return true;
      const cible = normaliser(
        [
          e.description,
          libelleEnfantDuSejour({ prenom: e.enfantPrenom, nom: e.enfantNom }, sejour),
          libelleEquipeDuSejour({ prenom: e.soigneurPrenom ?? '', nom: e.soigneurNom ?? '' }, sejour),
          e.localisationCorps ?? '',
          libelleSoins(e),
          libelleAppels(e),
        ].join(' '),
      );
      return cible.includes(terme);
    });
  }, [entrees, recherche, jourFiltre, sejour]);

  const basculerEntree = (entreeId: number) => {
    setOuverts((prev) => {
      const next = new Set(prev);
      if (next.has(entreeId)) next.delete(entreeId);
      else next.add(entreeId);
      return next;
    });
  };

  const ouvrirCreation = () => {
    setEntreeEdition(null);
    setErreurModal(null);
    setModalVisible(true);
  };

  const ouvrirEdition = (e: CahierInfirmerieEntreeDto) => {
    setEntreeEdition(e);
    setErreurModal(null);
    setModalVisible(true);
  };

  const fermerModal = () => {
    if (submitting) return;
    setModalVisible(false);
    setEntreeEdition(null);
    setErreurModal(null);
  };

  const enregistrer = useCallback(
    async (body: SaveCahierInfirmerieEntreeRequest) => {
      if (sejourId == null) return;
      setSubmitting(true);
      setErreurModal(null);
      try {
        if (entreeEdition) {
          await cahierInfirmerieService.modifierEntree(sejourId, entreeEdition.id, body);
        } else {
          await cahierInfirmerieService.creerEntree(sejourId, body);
        }
        setModalVisible(false);
        setEntreeEdition(null);
        const liste = await cahierInfirmerieService.listerEntrees(sejourId);
        setEntrees(liste);
      } catch (e: unknown) {
        setErreurModal(getUserFacingErrorMessage(e, 'Une erreur est survenue.'));
      } finally {
        setSubmitting(false);
      }
    },
    [sejourId, entreeEdition],
  );

  const supprimer = useCallback(
    (e: CahierInfirmerieEntreeDto) => {
      if (sejourId == null) return;
      Alert.alert(
        'Confirmer la suppression',
        `Supprimer cette entrée du ${dayjsDepuisValeurApi(e.dateHeure).format('DD/MM/YYYY HH:mm')} ? Cette action est définitive.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await cahierInfirmerieService.supprimerEntree(sejourId, e.id);
                const liste = await cahierInfirmerieService.listerEntrees(sejourId);
                setEntrees(liste);
              } catch (err: unknown) {
                Alert.alert('Suppression impossible', getUserFacingErrorMessage(err, 'Suppression impossible.'));
              }
            },
          },
        ],
      );
    },
    [sejourId],
  );

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

  return (
    <>
      <ListeEcranLayout
        data={entreesVisibles}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={refresh}
        filtres={
          <>
            <View style={styles.barre}>
              <TextInput
                style={styles.recherche}
                value={recherche}
                onChangeText={setRecherche}
                placeholder="Rechercher (enfant, description…)"
                placeholderTextColor={colors.muted}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              <Pressable
                onPress={ouvrirCreation}
                style={({ pressed }) => [styles.btnAjout, pressed && styles.btnPressed]}
              >
                <MaterialIcons name="add" size={22} color={colors.surface} />
              </Pressable>
            </View>

            {optionsJours.length > 1 ? (
              <View style={styles.barreJour}>
                <Dropdown
                  style={styles.dropdown}
                  containerStyle={styles.dropdownContainer}
                  placeholderStyle={styles.dropdownTexte}
                  selectedTextStyle={styles.dropdownTexte}
                  itemTextStyle={styles.dropdownItemText}
                  activeColor={colors.primarySoft}
                  data={optionsJours}
                  labelField="label"
                  valueField="value"
                  placeholder="Tous les jours"
                  value={jourFiltre}
                  onChange={(item) => setJourFiltre(item.value)}
                />
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => {
          const modifiable = peutModifierEntreeCahierInfirmerie(
            item,
            tokenUtilisateur,
            roleGlobal,
            sejour.directeur,
            sejour.equipe,
          );
          const supprimable = peutSupprimerEntreeCahierInfirmerie(
            item,
            tokenUtilisateur,
            roleGlobal,
            sejour.directeur,
            sejour.equipe,
          );
          const appelsLabel = libelleAppels(item);
          const soigneur = libelleEquipeDuSejour(
            { prenom: item.soigneurPrenom ?? '', nom: item.soigneurNom ?? '' },
            sejour,
          );
          const auteur = libelleEquipeDuSejour(
            { prenom: item.createurPrenom ?? '', nom: item.createurNom ?? '' },
            sejour,
          );
          const dateHeure = dayjsDepuisValeurApi(item.dateHeure);
          const nomEnfant = libelleEnfantDuSejour(
            { prenom: item.enfantPrenom, nom: item.enfantNom },
            sejour,
          );

          return (
            <ListeAccordion
              ouvert={ouverts.has(item.id)}
              onToggle={() => basculerEntree(item.id)}
              entete={
                <>
                  <Text style={listeAccordionStyles.titre} numberOfLines={2}>
                    {nomEnfant}
                  </Text>
                  <Text style={[listeAccordionStyles.sousTitre, styles.dateEntree]} numberOfLines={1}>
                    {dateHeure.format('DD/MM/YYYY · HH:mm')}
                  </Text>
                </>
              }
              corps={
                <>
                  <Text style={styles.description}>{item.description}</Text>

                  {item.localisationCorps?.trim() ? (
                    <Text style={styles.ligne}>
                      <Text style={styles.ligneLabel}>Localisation : </Text>
                      {item.localisationCorps.trim()}
                    </Text>
                  ) : null}
                  <Text style={styles.ligne}>
                    <Text style={styles.ligneLabel}>Soins : </Text>
                    {libelleSoins(item)}
                  </Text>
                  {appelsLabel ? (
                    <Text style={styles.ligne}>
                      <Text style={styles.ligneLabel}>Appels : </Text>
                      {appelsLabel}
                    </Text>
                  ) : null}
                  {soigneur ? (
                    <Text style={styles.ligne}>
                      <Text style={styles.ligneLabel}>Soigné(e) par : </Text>
                      {soigneur}
                    </Text>
                  ) : null}
                  <Text style={styles.ligne}>
                    <Text style={styles.ligneLabel}>Auteur : </Text>
                    {auteur || '—'}
                  </Text>

                  {modifiable || supprimable ? (
                    <View style={styles.icones}>
                      {modifiable ? (
                        <Pressable onPress={() => ouvrirEdition(item)} hitSlop={8} style={styles.iconeBtn}>
                          <MaterialIcons name="edit" size={20} color={colors.actionEdit} />
                        </Pressable>
                      ) : null}
                      {supprimable ? (
                        <Pressable onPress={() => supprimer(item)} hitSlop={8} style={styles.iconeBtn}>
                          <MaterialIcons name="delete-outline" size={20} color={colors.actionDelete} />
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </>
              }
            />
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {entrees.length === 0
              ? 'Aucune entrée pour ce séjour.'
              : 'Aucune entrée ne correspond à ce filtre.'}
          </Text>
        }
      />

      <CahierInfirmerieFormModal
        visible={modalVisible}
        sejour={sejour}
        entree={entreeEdition}
        enfants={enfantsOptions}
        soigneurs={soigneursOptions}
        tokenUtilisateur={(tokenUtilisateur ?? '').trim()}
        submitting={submitting}
        error={erreurModal}
        onFermer={fermerModal}
        onEnregistrer={enregistrer}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  recherche: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  btnAjout: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.actionAdd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.85,
  },
  barreJour: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  dropdown: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dropdownContainer: {
    borderRadius: radius.sm,
    maxHeight: 320,
  },
  dropdownTexte: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  dropdownItemText: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  dateEntree: {
    color: colors.primary,
    fontWeight: '600',
  },
  icones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconeBtn: {
    padding: 2,
  },
  description: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  ligne: {
    fontSize: fontSizes.sm,
    color: colors.text,
    marginTop: 4,
  },
  ligneLabel: {
    fontWeight: '600',
    color: colors.muted,
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
