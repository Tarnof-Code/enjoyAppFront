import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useAppSelector } from '../../store/hooks';
import { colors } from '../../config/theme';

interface TeamRow {
  key: string;
  prenom: string;
  nom: string;
  roleLabel: string;
  telephone?: string;
}

function libelleRole(role: string): string {
  if (role === 'DIRECTION') return 'Directeur';
  if (role === 'ADMIN') return 'Admin';
  return 'Animateur';
}

export default function Animators() {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);

  const directeur = sejour?.directeur;
  const membres = sejour?.equipe ?? [];

  const rows: TeamRow[] = [];
  if (directeur) {
    rows.push({
      key: directeur.tokenId,
      prenom: directeur.prenom,
      nom: directeur.nom,
      roleLabel: 'Directeur',
    });
  }
  membres
    .filter((membre) => !directeur || membre.tokenId !== directeur.tokenId)
    .forEach((membre) => {
      rows.push({
        key: membre.tokenId,
        prenom: membre.prenom,
        nom: membre.nom,
        roleLabel: libelleRole(String(membre.role)),
        telephone: membre.telephone || undefined,
      });
    });

  if (!sejour) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Aucun séjour sélectionné.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardMain}>
              <Text style={styles.name}>
                {item.prenom} {item.nom.toUpperCase()}
              </Text>
              {item.telephone ? (
                <Text style={styles.phone}>{item.telephone}</Text>
              ) : null}
            </View>
            <Text style={styles.role}>{item.roleLabel}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun membre dans l’équipe de ce séjour.</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  cardMain: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  phone: {
    marginTop: 4,
    fontSize: 14,
    color: colors.muted,
  },
  role: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 24,
  },
});
