import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { useRafraichirSejourCourant } from '../../hooks/useRafraichirSejourCourant';
import { enfantService } from '../../services/enfant.service';
import { groupeService } from '../../services/groupe.service';
import { chambreService } from '../../services/chambre.service';
import { dossierEnfantService } from '../../services/dossierEnfant.service';
import type { ChambreDto, DossierEnfantDto, EnfantDto, GroupeDto } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import FichePersonneModal, { LigneInfoFiche } from '../../Components/FichePersonneModal';
import ListeEcranLayout, { styleCarteListe } from '../../Components/ListeEcranLayout';
import { anniversairePendantSejour } from '../../helpers/anniversaireSejour';
import { libelleEnfantDuSejour, trierEnfantsDuSejour } from '../../helpers/triListesSejour';
import { colors, fontSizes } from '../../config/theme';

const FILTRE_TOUT = 'TOUT';

function normaliser(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function categorieGenre(genre: string): 'MASCULIN' | 'FEMININ' | 'AUTRE' {
  const g = normaliser(genre);
  if (g.startsWith('m')) return 'MASCULIN';
  if (g.startsWith('f')) return 'FEMININ';
  return 'AUTRE';
}

function libelleGenre(genre: string): string {
  const g = genre.trim();
  if (g === 'Masculin') return 'Garçon';
  if (g === 'Féminin') return 'Fille';
  const cat = categorieGenre(genre);
  if (cat === 'MASCULIN') return 'Garçon';
  if (cat === 'FEMININ') return 'Fille';
  return genre;
}

function age(dateNaissance: string): string {
  const annees = dayjs().diff(dayjs(dateNaissance), 'year');
  return Number.isFinite(annees) && annees >= 0 ? `${annees} ans` : '';
}

function groupesDeEnfant(enfantId: number, groupes: GroupeDto[]): string[] {
  return groupes
    .filter((groupe) => (groupe.enfants ?? []).some((enfant) => enfant.id === enfantId))
    .map((groupe) => groupe.nom);
}

function chambresDeEnfant(enfantId: number, chambres: ChambreDto[]): string[] {
  return chambres
    .filter((chambre) =>
      (chambre.occupants ?? []).some((occupant) => occupant.enfantId === enfantId),
    )
    .map((chambre) => {
      const occupant = chambre.occupants.find((o) => o.enfantId === enfantId);
      const identifiant = chambre.nom ? `${chambre.identifiant} (${chambre.nom})` : chambre.identifiant;
      return occupant?.numeroLit != null ? `${identifiant} · lit ${occupant.numeroLit}` : identifiant;
    });
}

export default function Children() {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejourId = sejour?.id;
  const [enfants, setEnfants] = useState<EnfantDto[]>([]);
  const [groupes, setGroupes] = useState<GroupeDto[]>([]);
  const [chambres, setChambres] = useState<ChambreDto[]>([]);
  const [dossiersParEnfant, setDossiersParEnfant] = useState<Record<number, DossierEnfantDto>>({});
  const [recherche, setRecherche] = useState('');
  const [groupesSelectionnes, setGroupesSelectionnes] = useState<string[]>([]);
  const [filtreGenre, setFiltreGenre] = useState<string>(FILTRE_TOUT);
  const [enfantSelectionne, setEnfantSelectionne] = useState<EnfantDto | null>(null);
  const rafraichirSejour = useRafraichirSejourCourant();

  const executer = useCallback(async () => {
    if (sejourId == null) return;
    const [, listeEnfants, listeGroupes, listeChambres, lignesDossiers] = await Promise.all([
      rafraichirSejour(),
      enfantService.getEnfantsBySejour(sejourId),
      groupeService.getGroupesBySejour(sejourId),
      chambreService.getChambresBySejour(sejourId),
      dossierEnfantService.getDossiersSanitairesBySejour(sejourId).catch(() => []),
    ]);
    const dossiers: Record<number, DossierEnfantDto> = {};
    for (const ligne of lignesDossiers) {
      if (ligne.dossier) dossiers[ligne.enfantId] = ligne.dossier;
    }
    setEnfants(listeEnfants);
    setGroupes(listeGroupes);
    setChambres(listeChambres);
    setDossiersParEnfant(dossiers);
  }, [sejourId, rafraichirSejour]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les enfants.',
  );

  const genresPresents = new Set(enfants.map((enfant) => categorieGenre(enfant.genre)));
  const filtresGenre: { cle: string; libelle: string }[] = [{ cle: FILTRE_TOUT, libelle: 'Tous' }];
  if (genresPresents.has('MASCULIN')) filtresGenre.push({ cle: 'MASCULIN', libelle: 'Garçons' });
  if (genresPresents.has('FEMININ')) filtresGenre.push({ cle: 'FEMININ', libelle: 'Filles' });

  const optionsGroupes = groupes.map((groupe) => ({ label: groupe.nom, value: String(groupe.id) }));

  const filtreGenreActif = filtresGenre.some((f) => f.cle === filtreGenre) ? filtreGenre : FILTRE_TOUT;
  const termeRecherche = normaliser(recherche);
  const enfantsVisibles = enfants.filter((enfant) => {
    if (filtreGenreActif !== FILTRE_TOUT && categorieGenre(enfant.genre) !== filtreGenreActif) {
      return false;
    }
    if (groupesSelectionnes.length > 0) {
      const estDansGroupe = groupes.some(
        (groupe) =>
          groupesSelectionnes.includes(String(groupe.id)) &&
          (groupe.enfants ?? []).some((e) => e.id === enfant.id),
      );
      if (!estDansGroupe) return false;
    }
    if (termeRecherche === '') return true;
    const cible = normaliser(`${enfant.prenom} ${enfant.nom}`);
    return cible.includes(termeRecherche);
  });
  const enfantsAffiches = trierEnfantsDuSejour(enfantsVisibles, sejour);

  if (!sejourId) {
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
        data={enfantsAffiches}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={refresh}
        filtres={
          <>
            <View style={styles.barreFiltres}>
              <TextInput
                style={styles.recherche}
                value={recherche}
                onChangeText={setRecherche}
                placeholder="Rechercher…"
                placeholderTextColor={colors.muted}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />

              {optionsGroupes.length > 0 ? (
                <MultiSelect
                  style={styles.dropdown}
                  containerStyle={styles.dropdownContainer}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownPlaceholder}
                  itemTextStyle={styles.dropdownItemText}
                  activeColor={colors.primarySoft}
                  data={optionsGroupes}
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
                        size={20}
                        color={selected ? colors.primary : colors.muted}
                      />
                      <Text style={styles.dropdownItemText}>{item.label}</Text>
                    </View>
                  )}
                />
              ) : null}
            </View>

            {filtresGenre.length > 1 ? (
              <View style={styles.filtres}>
                {filtresGenre.map(({ cle, libelle }) => {
                  const actif = cle === filtreGenreActif;
                  return (
                    <Pressable
                      key={cle}
                      onPress={() => setFiltreGenre(cle)}
                      style={[styles.chip, actif && styles.chipActif]}
                    >
                      <Text style={[styles.chipTexte, actif && styles.chipTexteActif]}>{libelle}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => {
          const groupesLabel = groupesDeEnfant(item.id, groupes).join(', ');
          const anniversaireLabel =
            sejour != null
              ? anniversairePendantSejour(item.dateNaissance, sejour.dateDebut, sejour.dateFin)
              : null;
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => setEnfantSelectionne(item)}
            >
              <View style={styles.cardMain}>
                <View style={styles.cardNom}>
                  {anniversaireLabel ? (
                    <MaterialIcons name="cake" size={18} color={colors.primary} />
                  ) : null}
                  <Text style={styles.name}>
                    {libelleEnfantDuSejour(item, sejour, { nomEnMajuscules: true })}
                  </Text>
                </View>
              </View>
              {groupesLabel ? <Text style={styles.groupe}>{groupesLabel}</Text> : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {enfants.length === 0
              ? 'Aucun enfant inscrit à ce séjour.'
              : 'Aucun enfant ne correspond à la recherche.'}
          </Text>
        }
      />

      <DetailEnfant
        enfant={enfantSelectionne}
        groupes={groupes}
        chambres={chambres}
        dossier={enfantSelectionne ? dossiersParEnfant[enfantSelectionne.id] : undefined}
        dateDebutSejour={sejour?.dateDebut}
        dateFinSejour={sejour?.dateFin}
        onFermer={() => setEnfantSelectionne(null)}
      />
    </>
  );
}

function DetailEnfant({
  enfant,
  groupes,
  chambres,
  dossier,
  dateDebutSejour,
  dateFinSejour,
  onFermer,
}: {
  enfant: EnfantDto | null;
  groupes: GroupeDto[];
  chambres: ChambreDto[];
  dossier?: DossierEnfantDto;
  dateDebutSejour?: string | number;
  dateFinSejour?: string | number;
  onFermer: () => void;
}) {
  const groupesEnfant = enfant ? groupesDeEnfant(enfant.id, groupes) : [];
  const chambresEnfant = enfant ? chambresDeEnfant(enfant.id, chambres) : [];
  const ageLabel = enfant ? age(enfant.dateNaissance) : '';
  const anniversaireLabel =
    enfant != null && dateDebutSejour != null && dateFinSejour != null
      ? anniversairePendantSejour(enfant.dateNaissance, dateDebutSejour, dateFinSejour)
      : null;
  const aDesInfos = !!(
    anniversaireLabel ||
    ageLabel ||
    enfant?.niveauScolaire ||
    groupesEnfant.length ||
    chambresEnfant.length ||
    dossier?.telephoneParent1 ||
    dossier?.emailParent1 ||
    dossier?.telephoneParent2 ||
    dossier?.emailParent2
  );

  return (
    <FichePersonneModal
      visible={enfant != null}
      onFermer={onFermer}
      prenom={enfant?.prenom ?? ''}
      nom={enfant?.nom ?? ''}
      sousTitre={enfant ? libelleGenre(enfant.genre) : ''}
      aucuneInfo={!aDesInfos}
    >
      {anniversaireLabel ? (
        <Text style={styles.anniversaire}>Anniversaire : {anniversaireLabel}</Text>
      ) : null}
      {ageLabel ? <LigneInfoFiche libelle="Âge" valeur={ageLabel} /> : null}
      {enfant?.niveauScolaire ? (
        <LigneInfoFiche libelle="Niveau scolaire" valeur={enfant.niveauScolaire} />
      ) : null}
      {groupesEnfant.length > 0 ? (
        <LigneInfoFiche
          libelle={groupesEnfant.length > 1 ? 'Groupes' : 'Groupe'}
          valeur={groupesEnfant.join(', ')}
        />
      ) : null}
      {chambresEnfant.length > 0 ? (
        <LigneInfoFiche
          libelle={chambresEnfant.length > 1 ? 'Chambres' : 'Chambre'}
          valeur={chambresEnfant.join(', ')}
        />
      ) : null}
      {dossier?.telephoneParent1 ? (
        <LigneInfoFiche
          libelle="Tél. parent 1"
          valeur={dossier.telephoneParent1}
          onPress={() => Linking.openURL(`tel:${dossier.telephoneParent1}`)}
        />
      ) : null}
      {dossier?.emailParent1 ? (
        <LigneInfoFiche
          libelle="E-mail parent 1"
          valeur={dossier.emailParent1}
          onPress={() => Linking.openURL(`mailto:${dossier.emailParent1}`)}
        />
      ) : null}
      {dossier?.telephoneParent2 ? (
        <LigneInfoFiche
          libelle="Tél. parent 2"
          valeur={dossier.telephoneParent2}
          onPress={() => Linking.openURL(`tel:${dossier.telephoneParent2}`)}
        />
      ) : null}
      {dossier?.emailParent2 ? (
        <LigneInfoFiche
          libelle="E-mail parent 2"
          valeur={dossier.emailParent2}
          onPress={() => Linking.openURL(`mailto:${dossier.emailParent2}`)}
        />
      ) : null}
    </FichePersonneModal>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  barreFiltres: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  recherche: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.text,
  },
  dropdown: {
    flex: 1,
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
  dropdownPlaceholder: {
    fontSize: 15,
    color: colors.text,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.text,
  },
  filtres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActif: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTexte: {
    fontSize: 13,
    color: colors.text,
  },
  chipTexteActif: {
    color: colors.surface,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    ...styleCarteListe,
  },
  cardPressed: {
    backgroundColor: colors.background,
  },
  cardMain: {
    flex: 1,
    paddingRight: 12,
  },
  cardNom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  groupe: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    flexShrink: 0,
    maxWidth: '40%',
    textAlign: 'right',
  },
  anniversaire: {
    fontSize: fontSizes.sm,
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
