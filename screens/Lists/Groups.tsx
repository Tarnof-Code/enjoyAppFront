import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { groupeService } from '../../services/groupe.service';
import type { GroupeDto, TypeGroupe } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors } from '../../config/theme';

function libelleType(type: TypeGroupe): string {
  if (type === 'AGE') return 'Par âge';
  if (type === 'NIVEAU_SCOLAIRE') return 'Par niveau';
  return 'Thématique';
}

function tranche(groupe: GroupeDto): string | null {
  if (groupe.typeGroupe === 'AGE' && (groupe.ageMin != null || groupe.ageMax != null)) {
    return `${groupe.ageMin ?? '?'} – ${groupe.ageMax ?? '?'} ans`;
  }
  if (
    groupe.typeGroupe === 'NIVEAU_SCOLAIRE' &&
    (groupe.niveauScolaireMin || groupe.niveauScolaireMax)
  ) {
    return `${groupe.niveauScolaireMin ?? '?'} → ${groupe.niveauScolaireMax ?? '?'}`;
  }
  return null;
}

export default function Groups() {
  const sejourId = useAppSelector((state) => state.sejour.sejourCourant?.id);
  const [groupes, setGroupes] = useState<GroupeDto[]>([]);

  const executer = useCallback(async () => {
    if (sejourId == null) return;
    setGroupes(await groupeService.getGroupesBySejour(sejourId));
  }, [sejourId]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les groupes.',
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
    <View style={styles.container}>
      <FlatList
        data={groupes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        renderItem={({ item }) => {
          const intervalle = tranche(item);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.nom}>{item.nom}</Text>
                <Text style={styles.type}>{libelleType(item.typeGroupe)}</Text>
              </View>
              {intervalle ? <Text style={styles.meta}>{intervalle}</Text> : null}
              {item.referents.length > 0 ? (
                <Text style={styles.referents}>
                  Référent(s) :{' '}
                  {item.referents.map((r) => `${r.prenom} ${r.nom}`).join(', ')}
                </Text>
              ) : null}
              <Text style={styles.count}>
                {item.enfants.length} enfant{item.enfants.length > 1 ? 's' : ''}
              </Text>
              {item.enfants.length > 0 ? (
                <View style={styles.enfants}>
                  {item.enfants.map((enfant) => (
                    <Text key={enfant.id} style={styles.enfant}>
                      • {enfant.prenom} {enfant.nom}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun groupe pour ce séjour.</Text>
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
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nom: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
    paddingRight: 12,
  },
  type: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    color: colors.muted,
  },
  referents: {
    marginTop: 6,
    fontSize: 14,
    color: colors.text,
  },
  count: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  enfants: {
    marginTop: 4,
  },
  enfant: {
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
