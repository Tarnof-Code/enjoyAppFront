import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';

import { getUserFacingErrorMessage } from '../../helpers/axiosError';
import { enfantService } from '../../services/enfant.service';
import type { EnfantDto } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors } from '../../config/theme';

function libelleGenre(genre: string): string {
  const g = genre.trim().toUpperCase();
  if (g.startsWith('M')) return 'Garçon';
  if (g.startsWith('F')) return 'Fille';
  return genre;
}

function age(dateNaissance: string): string {
  const annees = dayjs().diff(dayjs(dateNaissance), 'year');
  return Number.isFinite(annees) && annees >= 0 ? `${annees} ans` : '';
}

export default function Children() {
  const sejourId = useAppSelector((state) => state.sejour.sejourCourant?.id);
  const [enfants, setEnfants] = useState<EnfantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (sejourId == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await enfantService.getEnfantsBySejour(sejourId);
      setEnfants(data);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Impossible de charger les enfants.'));
    } finally {
      setLoading(false);
    }
  }, [sejourId]);

  useEffect(() => {
    void load();
  }, [load]);

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
        data={enfants}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const ageLabel = age(item.dateNaissance);
          const details = [libelleGenre(item.genre), ageLabel, item.niveauScolaire]
            .filter(Boolean)
            .join(' · ');
          return (
            <View style={styles.card}>
              <Text style={styles.name}>
                {item.prenom} {item.nom.toUpperCase()}
              </Text>
              {details ? <Text style={styles.meta}>{details}</Text> : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun enfant inscrit à ce séjour.</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
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
