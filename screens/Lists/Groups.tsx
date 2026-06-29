import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ListeAccordion, listeAccordionStyles } from '../../Components/ListeAccordion';
import ListeEcranLayout from '../../Components/ListeEcranLayout';
import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { groupeService } from '../../services/groupe.service';
import type { GroupeDto, SejourDTO, TypeGroupe } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { libelleEnfantDuSejour, trierEnfantsDuSejour } from '../../helpers/triListesSejour';
import { colors, fontSizes } from '../../config/theme';

const FILTRE_TOUT = 'TOUT';

const TYPES_GROUPE: { cle: TypeGroupe; libelle: string }[] = [
  { cle: 'AGE', libelle: 'Par âge' },
  { cle: 'NIVEAU_SCOLAIRE', libelle: 'Par niveau' },
  { cle: 'THEMATIQUE', libelle: 'Thématique' },
];

function libelleType(type: TypeGroupe): string {
  if (type === 'AGE') return 'Par âge';
  if (type === 'NIVEAU_SCOLAIRE') return 'Par niveau';
  return 'Thématique';
}

function detailGroupe(groupe: GroupeDto): string | null {
  if (groupe.typeGroupe === 'AGE' && (groupe.ageMin != null || groupe.ageMax != null)) {
    return `${groupe.ageMin ?? '?'} – ${groupe.ageMax ?? '?'} ans`;
  }
  if (
    groupe.typeGroupe === 'NIVEAU_SCOLAIRE' &&
    (groupe.niveauScolaireMin || groupe.niveauScolaireMax)
  ) {
    return `${groupe.niveauScolaireMin ?? '?'} → ${groupe.niveauScolaireMax ?? '?'}`;
  }
  if (groupe.typeGroupe === 'THEMATIQUE' && groupe.description?.trim()) {
    return groupe.description.trim();
  }
  return null;
}

function sousTitreGroupe(groupe: GroupeDto): string {
  const type = libelleType(groupe.typeGroupe);
  const detail = detailGroupe(groupe);
  return detail ? `${type} · ${detail}` : type;
}

function groupesAgeOuNiveauDeEnfant(enfantId: number, groupes: GroupeDto[]): string[] {
  return groupes
    .filter(
      (groupe) =>
        (groupe.typeGroupe === 'AGE' || groupe.typeGroupe === 'NIVEAU_SCOLAIRE') &&
        groupe.enfants.some((enfant) => enfant.id === enfantId),
    )
    .map((groupe) => groupe.nom);
}

type GroupeAccordionProps = {
  groupe: GroupeDto;
  tousLesGroupes: GroupeDto[];
  sejour: SejourDTO | null;
  ouvert: boolean;
  onToggle: () => void;
};

function GroupeAccordion({ groupe, tousLesGroupes, sejour, ouvert, onToggle }: GroupeAccordionProps) {
  return (
    <ListeAccordion
      ouvert={ouvert}
      onToggle={onToggle}
      entete={
        <>
          <View style={listeAccordionStyles.ligneTitre}>
            <Text style={listeAccordionStyles.titre} numberOfLines={2}>
              {groupe.nom}
            </Text>
            <Text style={styles.count}>
              {groupe.enfants.length} enfant{groupe.enfants.length > 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={listeAccordionStyles.sousTitre} numberOfLines={2}>
            {sousTitreGroupe(groupe)}
          </Text>
        </>
      }
      corps={
        groupe.enfants.length === 0 ? (
          <Text style={listeAccordionStyles.vide}>Aucun enfant dans ce groupe.</Text>
        ) : (
          trierEnfantsDuSejour(groupe.enfants, sejour).map((enfant) => {
            const groupesTranche =
              groupe.typeGroupe === 'THEMATIQUE'
                ? groupesAgeOuNiveauDeEnfant(enfant.id, tousLesGroupes)
                : [];
            return (
              <View key={enfant.id} style={listeAccordionStyles.ligneListe}>
                <Text style={listeAccordionStyles.ligneListeNom}>
                  {libelleEnfantDuSejour(enfant, sejour)}
                </Text>
                {groupesTranche.length > 0 ? (
                  <Text style={styles.enfantGroupe} numberOfLines={2}>
                    {groupesTranche.join(', ')}
                  </Text>
                ) : null}
              </View>
            );
          })
        )
      }
    />
  );
}

export default function Groups() {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejourId = sejour?.id;
  const [groupes, setGroupes] = useState<GroupeDto[]>([]);
  const [ouverts, setOuverts] = useState<Set<number>>(() => new Set());
  const [filtreType, setFiltreType] = useState<string>(FILTRE_TOUT);
  const executer = useCallback(async () => {
    if (sejourId == null) return;
    setGroupes(await groupeService.getGroupesBySejour(sejourId));
  }, [sejourId]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les groupes.',
  );

  const basculerGroupe = (groupeId: number) => {
    setOuverts((prev) => {
      const next = new Set(prev);
      if (next.has(groupeId)) next.delete(groupeId);
      else next.add(groupeId);
      return next;
    });
  };

  const typesPresents = new Set(groupes.map((groupe) => groupe.typeGroupe));
  const filtresType: { cle: string; libelle: string }[] = [{ cle: FILTRE_TOUT, libelle: 'Tous' }];
  for (const { cle, libelle } of TYPES_GROUPE) {
    if (typesPresents.has(cle)) filtresType.push({ cle, libelle });
  }

  const filtreTypeActif = filtresType.some((f) => f.cle === filtreType) ? filtreType : FILTRE_TOUT;
  const groupesVisibles =
    filtreTypeActif === FILTRE_TOUT
      ? groupes
      : groupes.filter((groupe) => groupe.typeGroupe === filtreTypeActif);

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
    <ListeEcranLayout
      data={groupesVisibles}
      keyExtractor={(item) => String(item.id)}
      refreshing={refreshing}
      onRefresh={refresh}
      filtres={
        filtresType.length > 1 ? (
          <View style={styles.filtres}>
            {filtresType.map(({ cle, libelle }) => {
              const actif = cle === filtreTypeActif;
              return (
                <Pressable
                  key={cle}
                  onPress={() => setFiltreType(cle)}
                  style={[styles.chip, actif && styles.chipActif]}
                >
                  <Text style={[styles.chipTexte, actif && styles.chipTexteActif]}>{libelle}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : undefined
      }
      renderItem={({ item }) => (
        <GroupeAccordion
          groupe={item}
          tousLesGroupes={groupes}
          sejour={sejour}
          ouvert={ouverts.has(item.id)}
          onToggle={() => basculerGroupe(item.id)}
        />
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>
          {groupes.length === 0
            ? 'Aucun groupe pour ce séjour.'
            : 'Aucun groupe ne correspond au filtre.'}
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
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
  count: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.muted,
  },
  enfantGroupe: {
    flexShrink: 1,
    maxWidth: '45%',
    fontSize: fontSizes.xs,
    color: colors.muted,
    textAlign: 'right',
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
