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
import { chambreService } from '../../services/chambre.service';
import type { ChambreDto, GenreChambre, TypeChambre } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors } from '../../config/theme';

function libelleType(type: TypeChambre): string {
  return type === 'EQUIPE' ? 'Équipe' : 'Enfants';
}

function libelleGenre(genre: GenreChambre): string {
  if (genre === 'MASCULIN') return 'Garçons';
  if (genre === 'FEMININ') return 'Filles';
  return 'Mixte';
}

function localisation(chambre: ChambreDto): string {
  const parts: string[] = [];
  if (chambre.batiment) parts.push(`Bât. ${chambre.batiment}`);
  if (chambre.etage != null) parts.push(`Étage ${chambre.etage}`);
  if (chambre.couloir) parts.push(`Couloir ${chambre.couloir}`);
  return parts.join(' · ');
}

export default function Bedrooms() {
  const sejourId = useAppSelector((state) => state.sejour.sejourCourant?.id);
  const [chambres, setChambres] = useState<ChambreDto[]>([]);

  const executer = useCallback(async () => {
    if (sejourId == null) return;
    setChambres(await chambreService.getChambresBySejour(sejourId));
  }, [sejourId]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les chambres.',
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
        data={chambres}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        renderItem={({ item }) => {
          const lieu = localisation(item);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.identifiant}>{item.identifiant}</Text>
                <Text style={styles.type}>{libelleType(item.typeChambre)}</Text>
              </View>
              {item.nom ? <Text style={styles.nom}>{item.nom}</Text> : null}
              <Text style={styles.meta}>
                {libelleGenre(item.genreAutorise)} · {item.occupants.length}/{item.capaciteMax}
              </Text>
              {lieu ? <Text style={styles.meta}>{lieu}</Text> : null}
              {item.groupe ? (
                <Text style={styles.groupe}>Groupe : {item.groupe.libelle}</Text>
              ) : null}
              {item.referents.length > 0 ? (
                <Text style={styles.referents}>
                  Référent(s) :{' '}
                  {item.referents.map((r) => `${r.prenom} ${r.nom}`).join(', ')}
                </Text>
              ) : null}
              {item.occupants.length > 0 ? (
                <View style={styles.occupants}>
                  {item.occupants.map((occ) => (
                    <Text key={occ.id} style={styles.occupant}>
                      {occ.numeroLit != null ? `Lit ${occ.numeroLit} : ` : '• '}
                      {occ.prenom} {occ.nom}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune chambre pour ce séjour.</Text>
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
  identifiant: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  type: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  nom: {
    marginTop: 2,
    fontSize: 15,
    color: colors.text,
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    color: colors.muted,
  },
  groupe: {
    marginTop: 6,
    fontSize: 14,
    color: colors.text,
  },
  referents: {
    marginTop: 6,
    fontSize: 14,
    color: colors.text,
  },
  occupants: {
    marginTop: 8,
  },
  occupant: {
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
