import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { sejourService } from '../../services/sejour.service';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSejourCourant } from '../../store/sejourSlice';
import { colors } from '../../config/theme';
import { ROLES_SEJOUR, libelleRoleSejour, libelleRoleSejourCourt } from '../../helpers/roleSejour';

interface TeamRow {
  key: string;
  prenom: string;
  nom: string;
  roleLabel: string;
  roleFiltre: string;
  telephone?: string;
}

const FILTRE_TOUT = 'TOUT';

function normaliser(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

export default function Animators() {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const dispatch = useAppDispatch();
  const sejourId = sejour?.id;
  const [refreshing, setRefreshing] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtreRole, setFiltreRole] = useState<string>(FILTRE_TOUT);

  const onRefresh = useCallback(async () => {
    if (sejourId == null) return;
    setRefreshing(true);
    try {
      const maj = await sejourService.getSejourById(sejourId);
      dispatch(setSejourCourant(maj));
    } catch {
      // rafraîchissement silencieux : on conserve les données déjà affichées
    } finally {
      setRefreshing(false);
    }
  }, [sejourId, dispatch]);

  const directeur = sejour?.directeur;
  const membres = sejour?.equipe ?? [];

  const rows: TeamRow[] = [];
  if (directeur) {
    rows.push({
      key: directeur.tokenId,
      prenom: directeur.prenom,
      nom: directeur.nom,
      roleLabel: 'Directeur',
      roleFiltre: 'DIRECTEUR',
    });
  }
  membres
    .filter((membre) => !directeur || membre.tokenId !== directeur.tokenId)
    .forEach((membre) => {
      rows.push({
        key: membre.tokenId,
        prenom: membre.prenom,
        nom: membre.nom,
        roleLabel: libelleRoleSejour(membre.roleSejour, membre.genre),
        roleFiltre: String(membre.roleSejour ?? 'AUTRE'),
        telephone: membre.telephone || undefined,
      });
    });

  const rolesPresents = new Set(membres.map((membre) => String(membre.roleSejour ?? 'AUTRE')));
  const filtresRole = [
    { cle: FILTRE_TOUT, libelle: 'Tous' },
    ...ROLES_SEJOUR.filter((role) => rolesPresents.has(role)).map((role) => ({
      cle: role,
      libelle: libelleRoleSejourCourt(role),
    })),
  ];

  const filtreRoleActif = filtresRole.some((f) => f.cle === filtreRole) ? filtreRole : FILTRE_TOUT;
  const termeRecherche = normaliser(recherche);
  const lignesVisibles = rows.filter((ligne) => {
    if (filtreRoleActif !== FILTRE_TOUT && ligne.roleFiltre !== filtreRoleActif) return false;
    if (termeRecherche === '') return true;
    const cible = normaliser(`${ligne.prenom} ${ligne.nom} ${ligne.telephone ?? ''}`);
    return cible.includes(termeRecherche);
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
      <TextInput
        style={styles.recherche}
        value={recherche}
        onChangeText={setRecherche}
        placeholder="Rechercher un membre…"
        placeholderTextColor={colors.muted}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      {filtresRole.length > 1 ? (
        <View style={styles.filtres}>
          {filtresRole.map(({ cle, libelle }) => {
            const actif = cle === filtreRoleActif;
            return (
              <Pressable
                key={cle}
                onPress={() => setFiltreRole(cle)}
                style={[styles.chip, actif && styles.chipActif]}
              >
                <Text style={[styles.chipTexte, actif && styles.chipTexteActif]}>{libelle}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <FlatList
        data={lignesVisibles}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
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
          <Text style={styles.empty}>
            {rows.length === 0
              ? 'Aucun membre dans l’équipe de ce séjour.'
              : 'Aucun membre ne correspond à la recherche.'}
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
  recherche: {
    marginHorizontal: 12,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.text,
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
    flexShrink: 0,
    maxWidth: '40%',
    textAlign: 'right',
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 24,
  },
});
