import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, SectionList, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { getUserFacingErrorMessage } from '../../helpers/axiosError';
import { jourISOdepuisValeurApi } from '../../helpers/dateApi';
import { activitePrestataireService } from '../../services/activitePrestataire.service';
import { groupeService } from '../../services/groupe.service';
import type { ActivitePrestataireDto } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors } from '../../config/theme';

dayjs.locale('fr');

interface JourSection {
  title: string;
  data: ActivitePrestataireDto[];
}

function premierOrdre(sortie: ActivitePrestataireDto): number {
  return sortie.moments?.[0]?.ordre ?? 0;
}

function construireSections(sorties: ActivitePrestataireDto[]): JourSection[] {
  const parJour = new Map<string, ActivitePrestataireDto[]>();
  for (const sortie of sorties) {
    const jour = jourISOdepuisValeurApi(sortie.date as unknown);
    if (!jour) continue;
    const liste = parJour.get(jour) ?? [];
    liste.push(sortie);
    parJour.set(jour, liste);
  }
  return [...parJour.keys()].sort().map((jour) => ({
    title: dayjs(jour).format('dddd D MMMM'),
    data: parJour
      .get(jour)!
      .slice()
      .sort((a, b) => premierOrdre(a) - premierOrdre(b)),
  }));
}

function horaires(sortie: ActivitePrestataireDto): string | null {
  if (sortie.heureDepart && sortie.heureRetour) {
    return `${sortie.heureDepart} → ${sortie.heureRetour}`;
  }
  if (sortie.heureDepart) return `Départ : ${sortie.heureDepart}`;
  if (sortie.heureRetour) return `Retour : ${sortie.heureRetour}`;
  return null;
}

function Liste() {
  const sejourId = useAppSelector((state) => state.sejour.sejourCourant?.id);
  const [sorties, setSorties] = useState<ActivitePrestataireDto[]>([]);
  const [groupes, setGroupes] = useState<Map<number, string>>(new Map());
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
      const [sortiesResult, groupesResult] = await Promise.allSettled([
        activitePrestataireService.getActivitesPrestatairesBySejour(sejourId),
        groupeService.getGroupesBySejour(sejourId),
      ]);
      if (sortiesResult.status === 'rejected') {
        throw sortiesResult.reason;
      }
      setSorties(sortiesResult.value);
      if (groupesResult.status === 'fulfilled') {
        setGroupes(new Map(groupesResult.value.map((g) => [g.id, g.nom])));
      }
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Impossible de charger les sorties.'));
    } finally {
      setLoading(false);
    }
  }, [sejourId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sections = construireSections(sorties);

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
      renderSectionHeader={({ section }) => <Text style={styles.jour}>{section.title}</Text>}
      renderItem={({ item }) => {
        const nomsMoments = (item.moments ?? []).map((m) => m.nom).filter(Boolean);
        const nomsGroupes = (item.groupeIds ?? [])
          .map((id) => groupes.get(id))
          .filter((v): v is string => !!v);
        const plage = horaires(item);
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.titre}>{item.nom}</Text>
              {nomsMoments.length > 0 ? (
                <Text style={styles.moment}>{nomsMoments.join(', ')}</Text>
              ) : null}
            </View>
            {plage ? <Text style={styles.ligne}>{plage}</Text> : null}
            {nomsGroupes.length > 0 ? (
              <Text style={styles.ligne}>Groupes : {nomsGroupes.join(', ')}</Text>
            ) : null}
            {item.informations ? (
              <Text style={styles.description}>{item.informations}</Text>
            ) : null}
            {item.telephone ? (
              <Text
                style={styles.lien}
                onPress={() => Linking.openURL(`tel:${item.telephone}`)}
              >
                {item.telephone}
              </Text>
            ) : null}
          </View>
        );
      }}
      ListEmptyComponent={<Text style={styles.empty}>Aucune sortie pour ce séjour.</Text>}
    />
  );
}

export default function Sorties() {
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
  lien: {
    fontSize: 14,
    color: colors.link,
    fontWeight: '600',
    marginTop: 6,
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
