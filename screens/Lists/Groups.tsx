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
import { MaterialIcons } from '@expo/vector-icons';

import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { groupeService } from '../../services/groupe.service';
import type { GroupeDto, TypeGroupe } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
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
  ouvert: boolean;
  onToggle: () => void;
};

function GroupeAccordion({ groupe, tousLesGroupes, ouvert, onToggle }: GroupeAccordionProps) {
  return (
    <View style={[styles.card, ouvert && styles.cardOuverte]}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.entete, pressed && styles.entetePressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: ouvert }}
      >
        <MaterialIcons
          name={ouvert ? 'expand-more' : 'chevron-right'}
          size={24}
          color={colors.primary}
          style={styles.chevron}
        />
        <View style={styles.enteteTexte}>
          <View style={styles.ligneTitre}>
            <Text style={styles.nom} numberOfLines={2}>
              {groupe.nom}
            </Text>
            <Text style={styles.count}>
              {groupe.enfants.length} enfant{groupe.enfants.length > 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.sousTitre} numberOfLines={2}>
            {sousTitreGroupe(groupe)}
          </Text>
        </View>
      </Pressable>

      {ouvert ? (
        <View style={styles.corps}>
          {groupe.enfants.length === 0 ? (
            <Text style={styles.vide}>Aucun enfant dans ce groupe.</Text>
          ) : (
            groupe.enfants.map((enfant) => {
              const groupesTranche =
                groupe.typeGroupe === 'THEMATIQUE'
                  ? groupesAgeOuNiveauDeEnfant(enfant.id, tousLesGroupes)
                  : [];
              return (
                <View key={enfant.id} style={styles.ligneEnfant}>
                  <Text style={styles.enfantNom}>
                    {enfant.prenom} {enfant.nom}
                  </Text>
                  {groupesTranche.length > 0 ? (
                    <Text style={styles.enfantGroupe} numberOfLines={2}>
                      {groupesTranche.join(', ')}
                    </Text>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

export default function Groups() {
  const sejourId = useAppSelector((state) => state.sejour.sejourCourant?.id);
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
    <View style={styles.container}>
      {filtresType.length > 1 ? (
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
      ) : null}

      <FlatList
        data={groupesVisibles}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <GroupeAccordion
            groupe={item}
            tousLesGroupes={groupes}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardOuverte: {
    borderColor: colors.primarySoft,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
    paddingLeft: 8,
  },
  entetePressed: {
    backgroundColor: colors.primarySoft,
  },
  chevron: {
    marginRight: 4,
  },
  enteteTexte: {
    flex: 1,
  },
  ligneTitre: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  nom: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  sousTitre: {
    marginTop: 4,
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  count: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.muted,
  },
  corps: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  ligneEnfant: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  enfantNom: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  enfantGroupe: {
    flexShrink: 1,
    maxWidth: '45%',
    fontSize: fontSizes.xs,
    color: colors.muted,
    textAlign: 'right',
  },
  vide: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    fontStyle: 'italic',
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
