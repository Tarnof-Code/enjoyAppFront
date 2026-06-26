import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { useRafraichirSejourCourant } from '../../hooks/useRafraichirSejourCourant';
import { dossierEnfantService } from '../../services/dossierEnfant.service';
import type { DossierEnfantDto, EnfantDossierSanitaireLigneDto, SejourDTO } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { libelleEnfantDuSejour, trierEnfantsDuSejour } from '../../helpers/triListesSejour';
import { colors } from '../../config/theme';

type Filtre = 'TOUT' | 'TRAITEMENTS' | 'REGIME' | 'MEDICAL';

const FILTRES: { cle: Filtre; libelle: string }[] = [
  { cle: 'TOUT', libelle: 'Tout' },
  { cle: 'TRAITEMENTS', libelle: 'Traitements' },
  { cle: 'REGIME', libelle: 'Régime' },
  { cle: 'MEDICAL', libelle: 'Médical' },
];

function aTraitements(d: DossierEnfantDto): boolean {
  return !!(d.traitementMatin || d.traitementMidi || d.traitementSoir || d.traitementSiBesoin);
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

function aContenu(d: DossierEnfantDto): boolean {
  return aTraitements(d) || aRegime(d) || aMedical(d) || !!d.autresInformations || !!d.aPrendreEnSortie;
}

function correspondAuFiltre(d: DossierEnfantDto, filtre: Filtre): boolean {
  if (filtre === 'TRAITEMENTS') return aTraitements(d);
  if (filtre === 'REGIME') return aRegime(d);
  if (filtre === 'MEDICAL') return aMedical(d);
  return aContenu(d);
}

function Ligne({ item, sejour }: { item: EnfantDossierSanitaireLigneDto; sejour: SejourDTO | null }) {
  const d = item.dossier!;
  const groupes = item.groupes.map((g) => g.libelle).filter(Boolean);
  const allergenes = d.allergenes.map((a) => a.libelle).filter(Boolean);
  const regimes = d.regimesEtPreferences.map((r) => r.libelle).filter(Boolean);

  return (
    <View style={styles.card}>
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
          {d.traitementMatin ? <Text style={styles.ligne}>Matin : {d.traitementMatin}</Text> : null}
          {d.traitementMidi ? <Text style={styles.ligne}>Midi : {d.traitementMidi}</Text> : null}
          {d.traitementSoir ? <Text style={styles.ligne}>Soir : {d.traitementSoir}</Text> : null}
          {d.traitementSiBesoin ? (
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
    </View>
  );
}

export default function DossierSanitaire() {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejourId = sejour?.id;
  const [lignes, setLignes] = useState<EnfantDossierSanitaireLigneDto[]>([]);
  const [filtre, setFiltre] = useState<Filtre>('TOUT');
  const rafraichirSejour = useRafraichirSejourCourant();

  const executer = useCallback(async () => {
    if (sejourId == null) return;
    const [, lignesSanitaire] = await Promise.all([
      rafraichirSejour(),
      dossierEnfantService.getDossiersSanitairesBySejour(sejourId),
    ]);
    setLignes(lignesSanitaire);
  }, [sejourId, rafraichirSejour]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les fiches sanitaires.',
  );

  const visibles = trierEnfantsDuSejour(
    lignes.filter((l) => l.dossier && correspondAuFiltre(l.dossier, filtre)),
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
    <View style={styles.flex}>
      <View style={styles.filtres}>
        {FILTRES.map(({ cle, libelle }) => {
          const actif = cle === filtre;
          return (
            <Pressable
              key={cle}
              onPress={() => setFiltre(cle)}
              style={[styles.chip, actif && styles.chipActif]}
            >
              <Text style={[styles.chipTexte, actif && styles.chipTexteActif]}>{libelle}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={visibles}
        keyExtractor={(item) => String(item.enfantId)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        renderItem={({ item }) => <Ligne item={item} sejour={sejour} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune information sanitaire pour ce filtre.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
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
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
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
