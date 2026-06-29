import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { MaterialIcons } from '@expo/vector-icons';

import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import ListeEcranLayout, { styleCarteListe } from '../../Components/ListeEcranLayout';
import DossierEnfantModal from '../../Components/DossierEnfantModal';
import { dossierEnfantService } from '../../services/dossierEnfant.service';
import type { DossierEnfantDto, EnfantDossierSanitaireLigneDto, SejourDTO } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { libelleEnfantDuSejour, trierEnfantsDuSejour } from '../../helpers/triListesSejour';
import { colors, fontSizes, radius, spacing } from '../../config/theme';

type Filtre = 'TOUT' | 'TRAITEMENTS' | 'REGIME' | 'MEDICAL' | 'A_PRENDRE_EN_SORTIE' | 'AUTRES_INFOS';
type FiltreTraitement = 'TOUS' | 'MATIN' | 'MIDI' | 'SOIR' | 'SI_BESOIN';

const OPTIONS_FILTRE: { value: Filtre; label: string }[] = [
  { value: 'TOUT', label: 'Tout' },
  { value: 'TRAITEMENTS', label: 'Traitements' },
  { value: 'REGIME', label: 'Alimentation' },
  { value: 'MEDICAL', label: 'Médical' },
  { value: 'A_PRENDRE_EN_SORTIE', label: 'À prendre en sortie' },
  { value: 'AUTRES_INFOS', label: 'Autres infos' },
];

const OPTIONS_FILTRE_TRAITEMENT: { value: FiltreTraitement; label: string }[] = [
  { value: 'TOUS', label: 'Tous les moments' },
  { value: 'MATIN', label: 'Matin' },
  { value: 'MIDI', label: 'Midi' },
  { value: 'SOIR', label: 'Soir' },
  { value: 'SI_BESOIN', label: 'Si besoin' },
];

function aTraitements(d: DossierEnfantDto): boolean {
  return !!(d.traitementMatin || d.traitementMidi || d.traitementSoir || d.traitementSiBesoin);
}

function correspondAuFiltreTraitement(d: DossierEnfantDto, moment: FiltreTraitement): boolean {
  if (moment === 'TOUS') return aTraitements(d);
  if (moment === 'MATIN') return !!d.traitementMatin;
  if (moment === 'MIDI') return !!d.traitementMidi;
  if (moment === 'SOIR') return !!d.traitementSoir;
  return !!d.traitementSiBesoin;
}

function momentTraitementVisible(
  moment: FiltreTraitement | undefined,
  cible: Exclude<FiltreTraitement, 'TOUS'>,
): boolean {
  return !moment || moment === 'TOUS' || moment === cible;
}

function aRegime(d: DossierEnfantDto): boolean {
  return (
    d.allergenes.length > 0 ||
    d.regimesEtPreferences.length > 0 ||
    !!d.informationsAlimentaires
  );
}

function aMedical(d: DossierEnfantDto): boolean {
  return !!(d.informationsMedicales || d.pai);
}

function aPrendreEnSortie(d: DossierEnfantDto): boolean {
  return !!d.aPrendreEnSortie;
}

function aAutresInfos(d: DossierEnfantDto): boolean {
  return !!d.autresInformations;
}

function aContenu(d: DossierEnfantDto): boolean {
  return (
    aTraitements(d) ||
    aRegime(d) ||
    aMedical(d) ||
    aPrendreEnSortie(d) ||
    aAutresInfos(d)
  );
}

function correspondAuFiltre(d: DossierEnfantDto, filtre: Filtre, filtreTraitement: FiltreTraitement): boolean {
  if (filtre === 'TRAITEMENTS') return correspondAuFiltreTraitement(d, filtreTraitement);
  if (filtre === 'REGIME') return aRegime(d);
  if (filtre === 'MEDICAL') return aMedical(d);
  if (filtre === 'A_PRENDRE_EN_SORTIE') return aPrendreEnSortie(d);
  if (filtre === 'AUTRES_INFOS') return aAutresInfos(d);
  return aContenu(d);
}

function normaliser(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function correspondRechercheEnfant(
  ligne: EnfantDossierSanitaireLigneDto,
  sejour: SejourDTO | null,
  terme: string,
): boolean {
  if (!terme) return true;
  const cible = normaliser(libelleEnfantDuSejour(ligne, sejour));
  return cible.includes(terme);
}

function Ligne({
  item,
  sejour,
  momentTraitement,
  onPress,
}: {
  item: EnfantDossierSanitaireLigneDto;
  sejour: SejourDTO | null;
  momentTraitement?: FiltreTraitement;
  onPress: () => void;
}) {
  const d = item.dossier!;
  const groupes = item.groupes.map((g) => g.libelle).filter(Boolean);
  const allergenes = d.allergenes.map((a) => a.libelle).filter(Boolean);
  const regimes = d.regimesEtPreferences.map((r) => r.libelle).filter(Boolean);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le dossier sanitaire de ${libelleEnfantDuSejour(item, sejour)}`}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.nom}>{libelleEnfantDuSejour(item, sejour)}</Text>
        {groupes.length > 0 ? <Text style={styles.groupes}>{groupes.join(', ')}</Text> : null}
      </View>

      {aMedical(d) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>Médical</Text>
          {d.informationsMedicales ? (
            <Text style={styles.ligne}>{d.informationsMedicales}</Text>
          ) : null}
          {d.pai ? <Text style={styles.ligne}>PAI : {d.pai}</Text> : null}
        </View>
      ) : null}

      {aRegime(d) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>Alimentaire</Text>
          {allergenes.length > 0 ? (
            <Text style={styles.ligne}>Allergènes : {allergenes.join(', ')}</Text>
          ) : null}
          {regimes.length > 0 ? (
            <Text style={styles.ligne}>Régimes : {regimes.join(', ')}</Text>
          ) : null}
          {d.informationsAlimentaires ? (
            <Text style={styles.ligne}>{d.informationsAlimentaires}</Text>
          ) : null}
        </View>
      ) : null}

      {aTraitements(d) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>Traitements</Text>
          {d.traitementMatin && momentTraitementVisible(momentTraitement, 'MATIN') ? (
            <Text style={styles.ligne}>Matin : {d.traitementMatin}</Text>
          ) : null}
          {d.traitementMidi && momentTraitementVisible(momentTraitement, 'MIDI') ? (
            <Text style={styles.ligne}>Midi : {d.traitementMidi}</Text>
          ) : null}
          {d.traitementSoir && momentTraitementVisible(momentTraitement, 'SOIR') ? (
            <Text style={styles.ligne}>Soir : {d.traitementSoir}</Text>
          ) : null}
          {d.traitementSiBesoin && momentTraitementVisible(momentTraitement, 'SI_BESOIN') ? (
            <Text style={styles.ligne}>Si besoin : {d.traitementSiBesoin}</Text>
          ) : null}
        </View>
      ) : null}

      {d.aPrendreEnSortie ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>À prendre en sortie</Text>
          <Text style={styles.ligne}>{d.aPrendreEnSortie}</Text>
        </View>
      ) : null}

      {d.autresInformations ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>Autres informations</Text>
          <Text style={styles.ligne}>{d.autresInformations}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function DossierSanitaire() {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejourId = sejour?.id;
  const [lignes, setLignes] = useState<EnfantDossierSanitaireLigneDto[]>([]);
  const [ligneSelectionnee, setLigneSelectionnee] = useState<EnfantDossierSanitaireLigneDto | null>(
    null,
  );
  const [filtre, setFiltre] = useState<Filtre>('TOUT');
  const [filtreTraitement, setFiltreTraitement] = useState<FiltreTraitement>('TOUS');
  const [recherche, setRecherche] = useState('');
  const executer = useCallback(async () => {
    if (sejourId == null) return;
    setLignes(await dossierEnfantService.getDossiersSanitairesBySejour(sejourId));
  }, [sejourId]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les fiches sanitaires.',
  );

  const termeRecherche = normaliser(recherche);

  const visibles = trierEnfantsDuSejour(
    lignes.filter(
      (l) =>
        l.dossier &&
        correspondAuFiltre(l.dossier, filtre, filtreTraitement) &&
        correspondRechercheEnfant(l, sejour, termeRecherche),
    ),
    sejour,
  );

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
        data={visibles}
        keyExtractor={(item) => String(item.enfantId)}
        refreshing={refreshing}
        onRefresh={refresh}
        filtres={
        <View style={styles.barreFiltre}>
          <View style={styles.ligneFiltres}>
            <View style={styles.rechercheConteneur}>
              <TextInput
                style={styles.recherche}
                value={recherche}
                onChangeText={setRecherche}
                placeholder="Rechercher un enfant…"
                placeholderTextColor={colors.muted}
                autoCorrect={false}
              />
              {recherche.length > 0 ? (
                <Pressable
                  style={styles.rechercheEffacer}
                  onPress={() => setRecherche('')}
                  hitSlop={8}
                  accessibilityLabel="Effacer la recherche"
                >
                  <MaterialIcons name="close" size={20} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>
            <Dropdown
              style={styles.dropdownFiltre}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.dropdownTexte}
              selectedTextStyle={styles.dropdownTexte}
              itemTextStyle={styles.dropdownItemText}
              activeColor={colors.primarySoft}
              data={OPTIONS_FILTRE}
              labelField="label"
              valueField="value"
              placeholder="Filtrer"
              value={filtre}
              onChange={(item) => {
                setFiltre(item.value);
                if (item.value !== 'TRAITEMENTS') setFiltreTraitement('TOUS');
              }}
            />
          </View>
          {filtre === 'TRAITEMENTS' ? (
            <Dropdown
              style={styles.dropdownPlein}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.dropdownTexte}
              selectedTextStyle={styles.dropdownTexte}
              itemTextStyle={styles.dropdownItemText}
              activeColor={colors.primarySoft}
              data={OPTIONS_FILTRE_TRAITEMENT}
              labelField="label"
              valueField="value"
              placeholder="Moment"
              value={filtreTraitement}
              onChange={(item) => setFiltreTraitement(item.value)}
            />
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <Ligne
          item={item}
          sejour={sejour}
          momentTraitement={filtre === 'TRAITEMENTS' ? filtreTraitement : undefined}
          onPress={() => setLigneSelectionnee(item)}
        />
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>Aucune information sanitaire pour ce filtre.</Text>
      }
    />

      {sejour ? (
        <DossierEnfantModal
          visible={ligneSelectionnee != null}
          sejour={sejour}
          ligne={ligneSelectionnee}
          onFermer={() => setLigneSelectionnee(null)}
        />
      ) : null}
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
  barreFiltre: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  ligneFiltres: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rechercheConteneur: {
    flex: 3,
    minWidth: 0,
    position: 'relative',
  },
  recherche: {
    width: '100%',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingRight: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  rechercheEffacer: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  dropdownFiltre: {
    flex: 2,
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dropdownPlein: {
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
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    ...styleCarteListe,
  },
  cardPressed: {
    backgroundColor: colors.background,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nom: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  groupes: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  section: {
    marginTop: 8,
  },
  sectionTitre: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.info,
    marginBottom: 2,
  },
  ligne: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
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
