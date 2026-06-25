import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { useRafraichirSejourCourant } from '../../hooks/useRafraichirSejourCourant';
import { jourISOdepuisValeurApi } from '../../helpers/dateApi';
import { activiteService } from '../../services/activite.service';
import { groupeService } from '../../services/groupe.service';
import type { ActiviteDto } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { libelleEquipeDuSejour } from '../../helpers/triListesSejour';
import { colors } from '../../config/theme';

dayjs.locale('fr');

interface JourSection {
  title: string;
  data: ActiviteDto[];
}

function construireSections(activites: ActiviteDto[]): JourSection[] {
  const parJour = new Map<string, ActiviteDto[]>();
  for (const activite of activites) {
    const jour = jourISOdepuisValeurApi(activite.date as unknown);
    if (!jour) continue;
    const liste = parJour.get(jour) ?? [];
    liste.push(activite);
    parJour.set(jour, liste);
  }
  return [...parJour.keys()].sort().map((jour) => ({
    title: dayjs(jour).format('dddd D MMMM'),
    data: parJour
      .get(jour)!
      .slice()
      .sort((a, b) => (a.moment?.ordre ?? 0) - (b.moment?.ordre ?? 0)),
  }));
}

function Liste() {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejourId = sejour?.id;
  const [activites, setActivites] = useState<ActiviteDto[]>([]);
  const [groupes, setGroupes] = useState<Map<number, string>>(new Map());
  const rafraichirSejour = useRafraichirSejourCourant();

  const executer = useCallback(async () => {
    if (sejourId == null) return;
    const [activitesResult, groupesResult] = await Promise.allSettled([
      activiteService.getActivitesBySejour(sejourId),
      groupeService.getGroupesBySejour(sejourId),
      rafraichirSejour(),
    ]);
    if (activitesResult.status === 'rejected') {
      throw activitesResult.reason;
    }
    setActivites(activitesResult.value);
    if (groupesResult.status === 'fulfilled') {
      setGroupes(new Map(groupesResult.value.map((g) => [g.id, g.nom])));
    }
  }, [sejourId, rafraichirSejour]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les activités.',
  );

  const sections = construireSections(activites);

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
    <SectionList
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
      }
      renderSectionHeader={({ section }) => <Text style={styles.jour}>{section.title}</Text>}
      renderItem={({ item }) => {
        const animateurs = (item.membres ?? [])
          .map((m) => libelleEquipeDuSejour(m, sejour))
          .filter(Boolean);
        const nomsGroupes = (item.groupeIds ?? [])
          .map((id) => groupes.get(id))
          .filter((v): v is string => !!v);
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.titre}>{item.nom}</Text>
              {item.moment?.nom ? <Text style={styles.moment}>{item.moment.nom}</Text> : null}
            </View>
            {item.typeActivite?.libelle ? (
              <Text style={styles.type}>{item.typeActivite.libelle}</Text>
            ) : null}
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
            {item.lieu?.nom ? <Text style={styles.ligne}>Lieu : {item.lieu.nom}</Text> : null}
            {animateurs.length > 0 ? (
              <Text style={styles.ligne}>Animateurs : {animateurs.join(', ')}</Text>
            ) : null}
            {nomsGroupes.length > 0 ? (
              <Text style={styles.ligne}>Groupes : {nomsGroupes.join(', ')}</Text>
            ) : null}
          </View>
        );
      }}
      ListEmptyComponent={<Text style={styles.empty}>Aucune activité pour ce séjour.</Text>}
    />
  );
}

export default function Activites() {
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
    backgroundColor: colors.surface,
  },
  jour: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'capitalize',
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
  },
  titre: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  moment: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  type: {
    fontSize: 13,
    color: colors.info,
    marginTop: 2,
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
