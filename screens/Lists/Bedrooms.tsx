import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { MaterialIcons } from '@expo/vector-icons';

import { ListeAccordion, listeAccordionStyles } from '../../Components/ListeAccordion';
import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { chambreService } from '../../services/chambre.service';
import { groupeService } from '../../services/groupe.service';
import type { ChambreDto, ChambreOccupantDto, GenreChambre, GroupeDto, TypeChambre } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors } from '../../config/theme';

const FILTRE_TOUT = 'TOUT';

type OptionFiltre = {
  value: string;
  libelle: string;
  libelleCourt: string;
};

const TYPES_CHAMBRE: { cle: TypeChambre; libelle: string; libelleCourt: string }[] = [
  { cle: 'ENFANT', libelle: 'Enfants', libelleCourt: 'Enfants' },
  { cle: 'EQUIPE', libelle: 'Équipe', libelleCourt: 'Équipe' },
];

const GENRES_CHAMBRE: { cle: GenreChambre; libelle: string; libelleCourt: string }[] = [
  { cle: 'MASCULIN', libelle: 'Garçons', libelleCourt: 'Garçons' },
  { cle: 'FEMININ', libelle: 'Filles', libelleCourt: 'Filles' },
  { cle: 'MIXTE', libelle: 'Mixte', libelleCourt: 'Mixte' },
];

function libelleType(type: TypeChambre): string {
  return type === 'EQUIPE' ? 'Équipe' : 'Enfants';
}

function libelleGenre(genre: GenreChambre): string {
  if (genre === 'MASCULIN') return 'Garçons';
  if (genre === 'FEMININ') return 'Filles';
  return 'Mixte';
}

function titreChambre(chambre: ChambreDto): string {
  const identifiant = chambre.identifiant.trim();
  const nom = chambre.nom?.trim();
  if (nom && nom !== identifiant) return `${identifiant} · ${nom}`;
  return identifiant;
}

function groupesAgeOuNiveau(groupes: GroupeDto[]): GroupeDto[] {
  return groupes
    .filter((groupe) => groupe.typeGroupe === 'AGE' || groupe.typeGroupe === 'NIVEAU_SCOLAIRE')
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
}

function chambreAPlacesDispo(chambre: ChambreDto): boolean {
  return chambre.occupants.length < chambre.capaciteMax;
}

function chambreCorrespondFiltreGroupe(chambre: ChambreDto, groupeId: string): boolean {
  if (groupeId === FILTRE_TOUT) return true;
  if (chambre.typeChambre !== 'ENFANT') return false;

  return chambre.groupe?.id != null && String(chambre.groupe.id) === groupeId;
}

function occupantsVisibles(chambre: ChambreDto): ChambreOccupantDto[] {
  if (chambre.typeChambre === 'EQUIPE') {
    return chambre.occupants.filter((occupant) => occupant.membreTokenId != null);
  }
  return chambre.occupants.filter((occupant) => occupant.enfantId != null);
}

function messageOccupantsVides(type: TypeChambre): string {
  return type === 'EQUIPE'
    ? 'Aucun membre de l’équipe dans cette chambre.'
    : 'Aucun enfant dans cette chambre.';
}

type JaugeRemplissageProps = {
  occupes: number;
  capacite: number;
};

function JaugeRemplissage({ occupes, capacite }: JaugeRemplissageProps) {
  const ratio = capacite > 0 ? Math.min(100, (occupes / capacite) * 100) : 0;
  const pleine = capacite > 0 && occupes >= capacite;

  return (
    <View style={styles.jauge}>
      <View style={styles.jaugePiste}>
        <View
          style={[
            styles.jaugeRemplissage,
            pleine && styles.jaugePleine,
            { width: `${ratio}%` },
          ]}
        />
      </View>
      <Text style={styles.jaugeLabel}>
        {occupes}/{capacite}
      </Text>
    </View>
  );
}

type ChambreAccordionProps = {
  chambre: ChambreDto;
  ouvert: boolean;
  onToggle: () => void;
};

function ChambreAccordion({ chambre, ouvert, onToggle }: ChambreAccordionProps) {
  const occupants = occupantsVisibles(chambre);
  const groupeLibelle = chambre.typeChambre === 'ENFANT' ? chambre.groupe?.libelle?.trim() : null;

  return (
    <ListeAccordion
      ouvert={ouvert}
      onToggle={onToggle}
      entete={
        <>
          <View style={listeAccordionStyles.ligneTitre}>
            <Text style={listeAccordionStyles.titre} numberOfLines={2}>
              {titreChambre(chambre)}
            </Text>
            <Text style={listeAccordionStyles.badge}>{libelleType(chambre.typeChambre)}</Text>
          </View>
          <View style={styles.metaLigne}>
            <Text style={listeAccordionStyles.sousTitre}>{libelleGenre(chambre.genreAutorise)}</Text>
            <JaugeRemplissage occupes={chambre.occupants.length} capacite={chambre.capaciteMax} />
          </View>
          {groupeLibelle ? (
            <Text style={styles.groupe} numberOfLines={2}>
              {groupeLibelle}
            </Text>
          ) : null}
        </>
      }
      corps={
        occupants.length === 0 ? (
          <Text style={listeAccordionStyles.vide}>{messageOccupantsVides(chambre.typeChambre)}</Text>
        ) : (
          occupants.map((occupant) => (
            <View key={occupant.id} style={listeAccordionStyles.ligneListe}>
              <Text style={listeAccordionStyles.ligneListeNom}>
                {occupant.numeroLit != null ? `Lit ${occupant.numeroLit} · ` : ''}
                {occupant.prenom} {occupant.nom}
              </Text>
            </View>
          ))
        )
      }
    />
  );
}

export default function Bedrooms() {
  const sejourId = useAppSelector((state) => state.sejour.sejourCourant?.id);
  const [chambres, setChambres] = useState<ChambreDto[]>([]);
  const [groupes, setGroupes] = useState<GroupeDto[]>([]);
  const [ouverts, setOuverts] = useState<Set<number>>(() => new Set());
  const [filtreType, setFiltreType] = useState<string>(FILTRE_TOUT);
  const [filtreGenre, setFiltreGenre] = useState<string>(FILTRE_TOUT);
  const [filtreGroupe, setFiltreGroupe] = useState<string>(FILTRE_TOUT);
  const [filtrePlacesDispo, setFiltrePlacesDispo] = useState(false);

  const executer = useCallback(async () => {
    if (sejourId == null) return;
    const [listeChambres, listeGroupes] = await Promise.all([
      chambreService.getChambresBySejour(sejourId),
      groupeService.getGroupesBySejour(sejourId),
    ]);
    setChambres(listeChambres);
    setGroupes(listeGroupes);
  }, [sejourId]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les chambres.',
  );

  const basculerChambre = (chambreId: number) => {
    setOuverts((prev) => {
      const next = new Set(prev);
      if (next.has(chambreId)) next.delete(chambreId);
      else next.add(chambreId);
      return next;
    });
  };

  const typesPresents = new Set(chambres.map((chambre) => chambre.typeChambre));
  const optionsType: OptionFiltre[] = [
    { value: FILTRE_TOUT, libelle: 'Tous les types', libelleCourt: 'Type' },
  ];
  for (const { cle, libelle, libelleCourt } of TYPES_CHAMBRE) {
    if (typesPresents.has(cle)) {
      optionsType.push({ value: cle, libelle, libelleCourt });
    }
  }

  const genresPresents = new Set(chambres.map((chambre) => chambre.genreAutorise));
  const optionsGenre: OptionFiltre[] = [
    { value: FILTRE_TOUT, libelle: 'Tous les genres', libelleCourt: 'Genre' },
  ];
  for (const { cle, libelle, libelleCourt } of GENRES_CHAMBRE) {
    if (genresPresents.has(cle)) {
      optionsGenre.push({ value: cle, libelle, libelleCourt });
    }
  }

  const filtreTypeActif = optionsType.some((f) => f.value === filtreType) ? filtreType : FILTRE_TOUT;
  const filtreGenreActif = optionsGenre.some((f) => f.value === filtreGenre) ? filtreGenre : FILTRE_TOUT;

  const groupesFiltre = groupesAgeOuNiveau(groupes);
  const optionsGroupes: OptionFiltre[] = [
    { value: FILTRE_TOUT, libelle: 'Tous les groupes', libelleCourt: 'Groupes' },
    ...groupesFiltre.map((groupe) => ({
      value: String(groupe.id),
      libelle: groupe.nom,
      libelleCourt: groupe.nom,
    })),
  ];

  const filtreGroupeActif = optionsGroupes.some((f) => f.value === filtreGroupe)
    ? filtreGroupe
    : FILTRE_TOUT;

  const afficherFiltreGroupe =
    filtreTypeActif !== 'EQUIPE' && typesPresents.has('ENFANT') && groupesFiltre.length > 0;

  useEffect(() => {
    if (filtreTypeActif === 'EQUIPE') {
      setFiltreGroupe(FILTRE_TOUT);
    }
  }, [filtreTypeActif]);

  const chambresVisibles = chambres
    .filter((chambre) => {
      if (filtreTypeActif !== FILTRE_TOUT && chambre.typeChambre !== filtreTypeActif) return false;
      if (filtreGenreActif !== FILTRE_TOUT && chambre.genreAutorise !== filtreGenreActif) return false;
      if (filtrePlacesDispo && !chambreAPlacesDispo(chambre)) return false;
      if (
        filtreTypeActif !== 'EQUIPE' &&
        !chambreCorrespondFiltreGroupe(chambre, filtreGroupeActif)
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) =>
      a.identifiant.trim().localeCompare(b.identifiant.trim(), 'fr', { sensitivity: 'base' }),
    );

  const afficherFiltres = chambres.length > 0;

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
      {afficherFiltres ? (
        <View style={styles.barreFiltres}>
          <View style={styles.ligneFiltres}>
            {optionsType.length > 1 ? (
              <Dropdown
                style={styles.filtre}
                containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.filtreTexte}
                selectedTextStyle={styles.filtreTexte}
                itemTextStyle={styles.dropdownItemText}
                activeColor={colors.primarySoft}
                data={optionsType}
                labelField="libelleCourt"
                valueField="value"
                value={filtreTypeActif}
                onChange={(item) => setFiltreType(item.value)}
                renderItem={(item, selected) => (
                  <View style={styles.dropdownItem}>
                    {selected ? (
                      <MaterialIcons name="check" size={18} color={colors.primary} />
                    ) : (
                      <View style={styles.dropdownItemSpacer} />
                    )}
                    <Text style={styles.dropdownItemText}>{item.libelle}</Text>
                  </View>
                )}
              />
            ) : null}

            {optionsGenre.length > 1 ? (
              <Dropdown
                style={styles.filtre}
                containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.filtreTexte}
                selectedTextStyle={styles.filtreTexte}
                itemTextStyle={styles.dropdownItemText}
                activeColor={colors.primarySoft}
                data={optionsGenre}
                labelField="libelleCourt"
                valueField="value"
                value={filtreGenreActif}
                onChange={(item) => setFiltreGenre(item.value)}
                renderItem={(item, selected) => (
                  <View style={styles.dropdownItem}>
                    {selected ? (
                      <MaterialIcons name="check" size={18} color={colors.primary} />
                    ) : (
                      <View style={styles.dropdownItemSpacer} />
                    )}
                    <Text style={styles.dropdownItemText}>{item.libelle}</Text>
                  </View>
                )}
              />
            ) : null}

            {afficherFiltreGroupe ? (
              <Dropdown
                style={styles.filtre}
                containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.filtreTexte}
                selectedTextStyle={styles.filtreTexte}
                itemTextStyle={styles.dropdownItemText}
                activeColor={colors.primarySoft}
                data={optionsGroupes}
                labelField="libelleCourt"
                valueField="value"
                value={filtreGroupeActif}
                onChange={(item) => setFiltreGroupe(item.value)}
                renderItem={(item, selected) => (
                  <View style={styles.dropdownItem}>
                    {selected ? (
                      <MaterialIcons name="check" size={18} color={colors.primary} />
                    ) : (
                      <View style={styles.dropdownItemSpacer} />
                    )}
                    <Text style={styles.dropdownItemText}>{item.libelle}</Text>
                  </View>
                )}
              />
            ) : null}

            <Pressable
              onPress={() => setFiltrePlacesDispo((actif) => !actif)}
              style={[styles.chipPlaces, filtrePlacesDispo && styles.chipPlacesActif]}
            >
              <Text style={[styles.chipPlacesTexte, filtrePlacesDispo && styles.chipPlacesTexteActif]}>
                Places dispo
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <FlatList
        data={chambresVisibles}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <ChambreAccordion
            chambre={item}
            ouvert={ouverts.has(item.id)}
            onToggle={() => basculerChambre(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {chambres.length === 0
              ? 'Aucune chambre pour ce séjour.'
              : 'Aucune chambre ne correspond aux filtres.'}
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
  barreFiltres: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  ligneFiltres: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filtre: {
    flex: 1,
    minWidth: 0,
    height: 40,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filtreTexte: {
    fontSize: 12,
    color: colors.text,
  },
  dropdownContainer: {
    borderRadius: 10,
    minWidth: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemSpacer: {
    width: 18,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  chipPlaces: {
    flexShrink: 0,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipPlacesActif: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPlacesTexte: {
    fontSize: 12,
    color: colors.text,
  },
  chipPlacesTexteActif: {
    color: colors.surface,
    fontWeight: '700',
  },
  list: {
    padding: 12,
  },
  metaLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  jauge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 80,
    maxWidth: 140,
  },
  jaugePiste: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  jaugeRemplissage: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 9999,
  },
  jaugePleine: {
    backgroundColor: colors.danger,
  },
  jaugeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    flexShrink: 0,
  },
  groupe: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
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
