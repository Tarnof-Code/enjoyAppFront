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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import Header from '../../Components/Header';
import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { planningGrilleService } from '../../services/planningGrille.service';
import type { OrganisationStackParamList } from '../../Navigators/types';
import type { PlanningGrilleSummaryDto } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors } from '../../config/theme';

dayjs.locale('fr');

type Props = NativeStackScreenProps<OrganisationStackParamList, 'GrillesList'>;

function formatMiseAJour(valeur: unknown): string {
  if (Array.isArray(valeur) && valeur.length >= 3) {
    const [annee, mois, jour, heure = 0, minute = 0] = valeur.map(Number);
    const dt = dayjs(new Date(annee, mois - 1, jour, heure, minute));
    return dt.isValid() ? dt.format('D MMM YYYY') : '';
  }
  const dt = dayjs(valeur as string | number);
  return dt.isValid() ? dt.format('D MMM YYYY') : '';
}

function GrillesList({ navigation }: Props) {
  const sejourId = useAppSelector((state) => state.sejour.sejourCourant?.id);
  const [grilles, setGrilles] = useState<PlanningGrilleSummaryDto[]>([]);

  const executer = useCallback(async () => {
    if (sejourId == null) return;
    setGrilles(await planningGrilleService.getPlanningGrillesBySejour(sejourId));
  }, [sejourId]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les plannings.',
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
    <FlatList
      data={grilles}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
      }
      renderItem={({ item }) => {
        const maj = formatMiseAJour(item.miseAJour as unknown);
        return (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() =>
              navigation.navigate('GrilleDetail', { grilleId: item.id, titre: item.titre })
            }
          >
            <Text style={styles.titre}>{item.titre}</Text>
            {maj ? <Text style={styles.meta}>Mis à jour le {maj}</Text> : null}
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <Text style={styles.empty}>Aucun planning pour ce séjour.</Text>
      }
    />
  );
}

export default function Organisation(props: Props) {
  return (
    <SafeAreaProvider>
      <Header iconName="calendar-alt" title="Organisation" />
      <GrillesList {...props} />
    </SafeAreaProvider>
  );
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
    backgroundColor: colors.surface,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardPressed: {
    opacity: 0.85,
  },
  titre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
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
