import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';
import { MaterialIcons } from '@expo/vector-icons';

import { sejourService } from '../../services/sejour.service';
import { groupeService } from '../../services/groupe.service';
import { chambreService } from '../../services/chambre.service';
import { utilisateurService } from '../../services/utilisateur.service';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSejourCourant } from '../../store/sejourSlice';
import FichePersonneModal, { LigneInfoFiche } from '../../Components/FichePersonneModal';
import { colors } from '../../config/theme';
import type { ChambreDto, GroupeDto } from '../../types/api';
import { ROLES_SEJOUR, libelleRoleSejour, libelleRoleSejourCourt } from '../../helpers/roleSejour';

interface TeamRow {
  key: string;
  prenom: string;
  nom: string;
  roleLabel: string;
  roleFiltre: string;
  telephone?: string;
  email?: string;
}

const FILTRE_TOUT = 'TOUT';
const FILTRE_DIRECTION = 'DIRECTION';

function normaliser(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function groupesDuMembre(tokenId: string, groupes: GroupeDto[]): string[] {
  return groupes
    .filter((groupe) => (groupe.referents ?? []).some((ref) => ref.tokenId === tokenId))
    .map((groupe) => groupe.nom);
}

function chambresDuMembre(tokenId: string, chambres: ChambreDto[]): string[] {
  return chambres
    .filter((chambre) =>
      (chambre.occupants ?? []).some((occ) => occ.membreTokenId === tokenId),
    )
    .map((chambre) => (chambre.nom ? `${chambre.identifiant} (${chambre.nom})` : chambre.identifiant));
}

export default function Animators() {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const dispatch = useAppDispatch();
  const sejourId = sejour?.id;
  const [refreshing, setRefreshing] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtreRole, setFiltreRole] = useState<string>(FILTRE_TOUT);
  const [groupesSelectionnes, setGroupesSelectionnes] = useState<string[]>([]);
  const [membreSelectionne, setMembreSelectionne] = useState<TeamRow | null>(null);
  const [groupes, setGroupes] = useState<GroupeDto[]>([]);
  const [chambres, setChambres] = useState<ChambreDto[]>([]);
  const [contactDirecteur, setContactDirecteur] = useState<{ telephone?: string; email?: string }>();

  const chargerAffectations = useCallback(async () => {
    if (sejourId == null) return;
    try {
      const [g, c] = await Promise.all([
        groupeService.getGroupesBySejour(sejourId),
        chambreService.getChambresBySejour(sejourId),
      ]);
      setGroupes(g);
      setChambres(c);
    } catch {
      // chargement silencieux : groupes/chambres restent vides si indisponibles
    }
  }, [sejourId]);

  useEffect(() => {
    chargerAffectations();
  }, [chargerAffectations]);

  const onRefresh = useCallback(async () => {
    if (sejourId == null) return;
    setRefreshing(true);
    try {
      const maj = await sejourService.getSejourById(sejourId);
      dispatch(setSejourCourant(maj));
      await chargerAffectations();
    } catch {
      // rafraîchissement silencieux : on conserve les données déjà affichées
    } finally {
      setRefreshing(false);
    }
  }, [sejourId, dispatch, chargerAffectations]);

  const directeur = sejour?.directeur;
  const membres = sejour?.equipe ?? [];
  const directeurTokenId = directeur?.tokenId;

  useEffect(() => {
    if (!directeurTokenId) {
      setContactDirecteur(undefined);
      return;
    }
    const profilEquipe = membres.find((membre) => membre.tokenId === directeurTokenId);
    if (profilEquipe) {
      setContactDirecteur({
        telephone: profilEquipe.telephone || undefined,
        email: profilEquipe.email || undefined,
      });
      return;
    }
    let annule = false;
    utilisateurService
      .getProfilByTokenId(directeurTokenId)
      .then((profil) => {
        if (!annule) {
          setContactDirecteur({
            telephone: profil.telephone || undefined,
            email: profil.email || undefined,
          });
        }
      })
      .catch(() => {
        if (!annule) setContactDirecteur(undefined);
      });
    return () => {
      annule = true;
    };
  }, [directeurTokenId, membres]);

  const rows: TeamRow[] = [];
  if (directeur) {
    rows.push({
      key: directeur.tokenId,
      prenom: directeur.prenom,
      nom: directeur.nom,
      roleLabel: 'Directeur',
      roleFiltre: 'DIRECTEUR',
      telephone: contactDirecteur?.telephone,
      email: contactDirecteur?.email,
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
        email: membre.email || undefined,
      });
    });

  const rolesPresents = new Set(membres.map((membre) => String(membre.roleSejour ?? 'AUTRE')));
  const aDirection = !!directeur || rolesPresents.has('ADJOINT');
  const filtresRole: { cle: string; libelle: string }[] = [{ cle: FILTRE_TOUT, libelle: 'Tous' }];
  for (const role of ROLES_SEJOUR) {
    if (role === 'ADJOINT') {
      if (aDirection) filtresRole.push({ cle: FILTRE_DIRECTION, libelle: 'Direction' });
    } else if (rolesPresents.has(role)) {
      filtresRole.push({ cle: role, libelle: libelleRoleSejourCourt(role) });
    }
  }

  const optionsGroupes = groupes.map((groupe) => ({ label: groupe.nom, value: String(groupe.id) }));

  const filtreRoleActif = filtresRole.some((f) => f.cle === filtreRole) ? filtreRole : FILTRE_TOUT;
  const termeRecherche = normaliser(recherche);
  const lignesVisibles = rows.filter((ligne) => {
    if (filtreRoleActif !== FILTRE_TOUT) {
      if (filtreRoleActif === FILTRE_DIRECTION) {
        if (ligne.roleFiltre !== 'DIRECTEUR' && ligne.roleFiltre !== 'ADJOINT') return false;
      } else if (ligne.roleFiltre !== filtreRoleActif) {
        return false;
      }
    }
    if (groupesSelectionnes.length > 0) {
      const estReferent = groupes.some(
        (groupe) =>
          groupesSelectionnes.includes(String(groupe.id)) &&
          (groupe.referents ?? []).some((ref) => ref.tokenId === ligne.key),
      );
      if (!estReferent) return false;
    }
    if (termeRecherche === '') return true;
    const cible = normaliser(`${ligne.prenom} ${ligne.nom} ${ligne.telephone ?? ''} ${ligne.email ?? ''}`);
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
      <View style={styles.barreFiltres}>
        <TextInput
          style={styles.recherche}
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Rechercher…"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {optionsGroupes.length > 0 ? (
          <MultiSelect
            style={styles.dropdown}
            containerStyle={styles.dropdownContainer}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownPlaceholder}
            itemTextStyle={styles.dropdownItemText}
            activeColor={colors.primarySoft}
            data={optionsGroupes}
            labelField="label"
            valueField="value"
            value={groupesSelectionnes}
            onChange={setGroupesSelectionnes}
            placeholder={
              groupesSelectionnes.length > 0
                ? `${groupesSelectionnes.length} groupe${groupesSelectionnes.length > 1 ? 's' : ''}`
                : 'Groupes'
            }
            visibleSelectedItem={false}
            renderItem={(item, selected) => (
              <View style={styles.dropdownItem}>
                <MaterialIcons
                  name={selected ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={selected ? colors.primary : colors.muted}
                />
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </View>
            )}
          />
        ) : null}
      </View>

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
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => setMembreSelectionne(item)}
          >
            <View style={styles.cardMain}>
              <Text style={styles.name}>
                {item.prenom} {item.nom.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.role}>{item.roleLabel}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {rows.length === 0
              ? 'Aucun membre dans l’équipe de ce séjour.'
              : 'Aucun membre ne correspond à la recherche.'}
          </Text>
        }
      />

      <DetailMembre
        membre={membreSelectionne}
        groupes={groupes}
        chambres={chambres}
        onFermer={() => setMembreSelectionne(null)}
      />
    </View>
  );
}

function DetailMembre({
  membre,
  groupes,
  chambres,
  onFermer,
}: {
  membre: TeamRow | null;
  groupes: GroupeDto[];
  chambres: ChambreDto[];
  onFermer: () => void;
}) {
  const groupesMembre = membre ? groupesDuMembre(membre.key, groupes) : [];
  const chambresMembre = membre ? chambresDuMembre(membre.key, chambres) : [];
  const aDesInfos = !!(
    membre?.telephone ||
    membre?.email ||
    groupesMembre.length ||
    chambresMembre.length
  );

  return (
    <FichePersonneModal
      visible={membre != null}
      onFermer={onFermer}
      prenom={membre?.prenom ?? ''}
      nom={membre?.nom ?? ''}
      sousTitre={membre?.roleLabel ?? ''}
      aucuneInfo={!aDesInfos}
    >
      {membre?.telephone ? (
        <LigneInfoFiche
          libelle="Téléphone"
          valeur={membre.telephone}
          onPress={() => Linking.openURL(`tel:${membre.telephone}`)}
        />
      ) : null}
      {membre?.email ? (
        <LigneInfoFiche
          libelle="E-mail"
          valeur={membre.email}
          onPress={() => Linking.openURL(`mailto:${membre.email}`)}
        />
      ) : null}
      {groupesMembre.length > 0 ? (
        <LigneInfoFiche
          libelle={groupesMembre.length > 1 ? 'Groupes' : 'Groupe'}
          valeur={groupesMembre.join(', ')}
        />
      ) : null}
      {chambresMembre.length > 0 ? (
        <LigneInfoFiche
          libelle={chambresMembre.length > 1 ? 'Chambres' : 'Chambre'}
          valeur={chambresMembre.join(', ')}
        />
      ) : null}
    </FichePersonneModal>
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
  barreFiltres: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  recherche: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.text,
  },
  dropdown: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dropdownContainer: {
    borderRadius: 10,
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: colors.text,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
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
  cardPressed: {
    backgroundColor: colors.background,
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
