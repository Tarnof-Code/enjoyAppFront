import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { MaterialIcons } from '@expo/vector-icons';

import AffecterOccupantsModal from '../../Components/AffecterOccupantsModal';
import ChambreFormulaireModal from '../../Components/ChambreFormulaireModal';
import { ListeAccordion, listeAccordionStyles } from '../../Components/ListeAccordion';
import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { useRafraichirSejourCourant } from '../../hooks/useRafraichirSejourCourant';
import {
  equipePourChambres,
  fusionnerChambreRetourneeDansListe,
  libelleChambre,
} from '../../helpers/chambreOccupantsUtils';
import { getUserFacingErrorMessage } from '../../helpers/axiosError';
import { libelleEnfantDuSejour, libelleEquipeDuSejour } from '../../helpers/triListesSejour';
import { chambreService } from '../../services/chambre.service';
import { enfantService } from '../../services/enfant.service';
import { groupeService } from '../../services/groupe.service';
import type {
  ChambreDto,
  ChambreOccupantDto,
  EnfantDto,
  GenreChambre,
  GroupeDto,
  SaveChambreRequest,
  SejourDTO,
  TypeChambre,
} from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors, fontSizes, radius, spacing } from '../../config/theme';

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
  sejour: SejourDTO | null;
  ouvert: boolean;
  actionEnCours: boolean;
  onToggle: () => void;
  onModifier: () => void;
  onAffecter: () => void;
  onSupprimer: () => void;
  onRetirerOccupant: (occupant: ChambreOccupantDto) => void;
};

function libelleOccupant(
  occupant: ChambreOccupantDto,
  typeChambre: TypeChambre,
  sejour: SejourDTO | null,
): string {
  return typeChambre === 'EQUIPE'
    ? libelleEquipeDuSejour(occupant, sejour)
    : libelleEnfantDuSejour(occupant, sejour);
}

function ChambreAccordion({
  chambre,
  sejour,
  ouvert,
  actionEnCours,
  onToggle,
  onModifier,
  onAffecter,
  onSupprimer,
  onRetirerOccupant,
}: ChambreAccordionProps) {
  const occupants = occupantsVisibles(chambre);
  const groupeLibelle = chambre.typeChambre === 'ENFANT' ? chambre.groupe?.libelle?.trim() : null;
  const chambrePleine = chambre.occupants.length >= chambre.capaciteMax;

  return (
    <ListeAccordion
      ouvert={ouvert}
      onToggle={onToggle}
      entete={
        <>
          <View style={listeAccordionStyles.ligneTitre}>
            <Text style={listeAccordionStyles.titre} numberOfLines={2}>
              {libelleChambre(chambre)}
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
        <>
          {occupants.length === 0 ? (
            <Text style={listeAccordionStyles.vide}>{messageOccupantsVides(chambre.typeChambre)}</Text>
          ) : (
            occupants.map((occupant) => (
              <View key={occupant.id} style={styles.ligneOccupant}>
                <Text style={listeAccordionStyles.ligneListeNom}>
                  {occupant.numeroLit != null ? `Lit ${occupant.numeroLit} · ` : ''}
                  {libelleOccupant(occupant, chambre.typeChambre, sejour)}
                </Text>
                <Pressable
                  onPress={() => onRetirerOccupant(occupant)}
                  disabled={actionEnCours}
                  style={({ pressed }) => [styles.boutonRetirer, pressed && styles.boutonRetirerPressed]}
                  accessibilityLabel="Retirer l'occupant"
                >
                  <MaterialIcons name="person-remove" size={20} color={colors.actionDelete} />
                </Pressable>
              </View>
            ))
          )}

          <View style={styles.actionsChambre}>
            {!chambrePleine ? (
              <Pressable
                onPress={onAffecter}
                disabled={actionEnCours}
                style={({ pressed }) => [
                  styles.boutonAction,
                  styles.boutonAffecter,
                  pressed && styles.boutonActionPressed,
                ]}
              >
                <MaterialIcons name="person-add" size={16} color={colors.surface} />
                <Text style={styles.boutonActionTexte}>Affecter</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onModifier}
              disabled={actionEnCours}
              style={({ pressed }) => [
                styles.boutonAction,
                styles.boutonModifier,
                pressed && styles.boutonActionPressed,
              ]}
            >
              <MaterialIcons name="edit" size={16} color={colors.surface} />
              <Text style={styles.boutonActionTexte}>Modifier</Text>
            </Pressable>
            <Pressable
              onPress={onSupprimer}
              disabled={actionEnCours}
              style={({ pressed }) => [
                styles.boutonAction,
                styles.boutonSupprimer,
                pressed && styles.boutonActionPressed,
              ]}
            >
              <MaterialIcons name="delete-outline" size={16} color={colors.surface} />
              <Text style={styles.boutonActionTexte}>Supprimer</Text>
            </Pressable>
          </View>
        </>
      }
    />
  );
}

export default function Bedrooms() {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejourId = sejour?.id;
  const [chambres, setChambres] = useState<ChambreDto[]>([]);
  const [enfants, setEnfants] = useState<EnfantDto[]>([]);
  const [groupes, setGroupes] = useState<GroupeDto[]>([]);
  const [ouverts, setOuverts] = useState<Set<number>>(() => new Set());
  const [filtreType, setFiltreType] = useState<string>(FILTRE_TOUT);
  const [filtreGenre, setFiltreGenre] = useState<string>(FILTRE_TOUT);
  const [filtreGroupe, setFiltreGroupe] = useState<string>(FILTRE_TOUT);
  const [filtrePlacesDispo, setFiltrePlacesDispo] = useState(false);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [chambreEnEdition, setChambreEnEdition] = useState<ChambreDto | null>(null);
  const [affecterChambre, setAffecterChambre] = useState<ChambreDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const rafraichirSejour = useRafraichirSejourCourant();

  const equipe = equipePourChambres(sejour?.equipe);

  const executer = useCallback(async () => {
    if (sejourId == null) return;
    const [, listeChambres, listeGroupes, listeEnfants] = await Promise.all([
      rafraichirSejour(),
      chambreService.getChambresBySejour(sejourId),
      groupeService.getGroupesBySejour(sejourId),
      enfantService.getEnfantsBySejour(sejourId),
    ]);
    setChambres(listeChambres);
    setGroupes(listeGroupes);
    setEnfants(listeEnfants);
  }, [sejourId, rafraichirSejour]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les chambres.',
  );

  const appliquerChambreRetournee = useCallback((chambreMiseAJour: ChambreDto) => {
    setChambres((prev) => fusionnerChambreRetourneeDansListe(prev, chambreMiseAJour));
  }, []);

  const basculerChambre = (chambreId: number) => {
    setOuverts((prev) => {
      const next = new Set(prev);
      if (next.has(chambreId)) next.delete(chambreId);
      else next.add(chambreId);
      return next;
    });
  };

  const ouvrirCreation = () => {
    setActionError(null);
    setChambreEnEdition(null);
    setFormulaireOuvert(true);
  };

  const ouvrirEdition = (chambre: ChambreDto) => {
    setActionError(null);
    setChambreEnEdition(chambre);
    setFormulaireOuvert(true);
  };

  const fermerFormulaire = () => {
    if (submitting) return;
    setFormulaireOuvert(false);
    setChambreEnEdition(null);
  };

  const handleEnregistrerChambre = async (payload: SaveChambreRequest) => {
    if (sejourId == null) return;
    setSubmitting(true);
    setActionError(null);
    try {
      if (chambreEnEdition == null) {
        const created = await chambreService.creerChambre(sejourId, payload);
        appliquerChambreRetournee(created);
      } else {
        const updated = await chambreService.modifierChambre(sejourId, chambreEnEdition.id, payload);
        appliquerChambreRetournee(updated);
      }
      setFormulaireOuvert(false);
      setChambreEnEdition(null);
    } catch (err: unknown) {
      const message = getUserFacingErrorMessage(
        err,
        chambreEnEdition == null
          ? 'Impossible de créer la chambre'
          : 'Impossible de modifier la chambre',
      );
      Alert.alert('Erreur', message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmerSuppression = (chambre: ChambreDto) => {
    Alert.alert(
      'Supprimer la chambre',
      `Voulez-vous vraiment supprimer la chambre « ${libelleChambre(chambre)} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => void supprimerChambre(chambre.id),
        },
      ],
    );
  };

  const supprimerChambre = async (chambreId: number) => {
    if (sejourId == null) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await chambreService.supprimerChambre(sejourId, chambreId);
      setChambres((prev) => prev.filter((c) => c.id !== chambreId));
      setOuverts((prev) => {
        const next = new Set(prev);
        next.delete(chambreId);
        return next;
      });
    } catch (err: unknown) {
      setActionError(getUserFacingErrorMessage(err, 'Impossible de supprimer la chambre'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmerRetraitOccupant = (chambre: ChambreDto, occupant: ChambreOccupantDto) => {
    Alert.alert(
      'Retirer un occupant',
      `Retirer ${libelleOccupant(occupant, chambre.typeChambre, sejour)} de cette chambre ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => void retirerOccupant(chambre, occupant),
        },
      ],
    );
  };

  const retirerOccupant = async (chambre: ChambreDto, occupant: ChambreOccupantDto) => {
    if (sejourId == null) return;
    setSubmitting(true);
    setActionError(null);
    try {
      if (occupant.enfantId != null) {
        await chambreService.retirerEnfant(sejourId, chambre.id, occupant.enfantId);
      } else if (occupant.membreTokenId?.trim()) {
        await chambreService.retirerMembreEquipe(sejourId, chambre.id, occupant.membreTokenId.trim());
      }
      setChambres((prev) =>
        prev.map((c) =>
          c.id !== chambre.id
            ? c
            : { ...c, occupants: c.occupants.filter((o) => o.id !== occupant.id) },
        ),
      );
    } catch (err: unknown) {
      setActionError(getUserFacingErrorMessage(err, "Impossible de retirer l'occupant"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAffecterSelection = async (selection: {
    enfantIds: number[];
    membreTokenIds: string[];
  }) => {
    if (sejourId == null || affecterChambre == null) return;
    setSubmitting(true);
    setActionError(null);
    try {
      let chambreMiseAJour: ChambreDto;
      if (affecterChambre.typeChambre === 'ENFANT') {
        const ids = selection.enfantIds;
        if (ids.length === 1) {
          chambreMiseAJour = await chambreService.affecterEnfant(sejourId, affecterChambre.id, ids[0]);
        } else {
          chambreMiseAJour = await chambreService.affecterEnfants(sejourId, affecterChambre.id, {
            occupants: ids.map((enfantId) => ({ enfantId })),
          });
        }
      } else {
        const tokenIds = selection.membreTokenIds;
        if (tokenIds.length === 1) {
          chambreMiseAJour = await chambreService.affecterMembreEquipe(
            sejourId,
            affecterChambre.id,
            tokenIds[0],
          );
        } else {
          chambreMiseAJour = await chambreService.affecterMembresEquipe(sejourId, affecterChambre.id, {
            occupants: tokenIds.map((membreTokenId) => ({ membreTokenId })),
          });
        }
      }
      appliquerChambreRetournee(chambreMiseAJour);
      setAffecterChambre(null);
    } catch (err: unknown) {
      Alert.alert('Erreur', getUserFacingErrorMessage(err, "Impossible d'affecter la sélection"));
    } finally {
      setSubmitting(false);
    }
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
      {actionError ? (
        <View style={styles.bandeauErreur}>
          <Text style={styles.bandeauErreurTexte}>{actionError}</Text>
          <Pressable onPress={() => setActionError(null)} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={colors.danger} />
          </Pressable>
        </View>
      ) : null}

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
            sejour={sejour}
            ouvert={ouverts.has(item.id)}
            actionEnCours={submitting}
            onToggle={() => basculerChambre(item.id)}
            onModifier={() => ouvrirEdition(item)}
            onAffecter={() => {
              setActionError(null);
              setAffecterChambre(item);
            }}
            onSupprimer={() => confirmerSuppression(item)}
            onRetirerOccupant={(occupant) => confirmerRetraitOccupant(item, occupant)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {chambres.length === 0
              ? 'Aucune chambre pour ce séjour. Appuyez sur + pour en ajouter une.'
              : 'Aucune chambre ne correspond aux filtres.'}
          </Text>
        }
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={ouvrirCreation}
        disabled={submitting}
        accessibilityLabel="Ajouter une chambre"
      >
        <MaterialIcons name="add" size={28} color={colors.surface} />
      </Pressable>

      <ChambreFormulaireModal
        visible={formulaireOuvert}
        chambre={chambreEnEdition}
        groupes={groupes}
        enfants={enfants}
        equipe={equipe}
        submitting={submitting}
        onFermer={fermerFormulaire}
        onEnregistrer={(payload) => void handleEnregistrerChambre(payload)}
      />

      <AffecterOccupantsModal
        visible={affecterChambre != null}
        chambre={affecterChambre}
        chambres={chambres}
        enfants={enfants}
        groupes={groupes}
        equipe={equipe}
        sejour={sejour}
        submitting={submitting}
        onFermer={() => !submitting && setAffecterChambre(null)}
        onAffecter={(selection) => void handleAffecterSelection(selection)}
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
  bandeauErreur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerSoft,
  },
  bandeauErreurTexte: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.danger,
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
    paddingBottom: 88,
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
  ligneOccupant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  boutonRetirer: {
    padding: spacing.xs,
  },
  boutonRetirerPressed: {
    opacity: 0.6,
  },
  actionsChambre: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  boutonAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  boutonAffecter: {
    backgroundColor: colors.actionAdd,
  },
  boutonModifier: {
    backgroundColor: colors.actionEdit,
  },
  boutonSupprimer: {
    backgroundColor: colors.actionDelete,
  },
  boutonActionPressed: {
    opacity: 0.85,
  },
  boutonActionTexte: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.surface,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.actionAdd,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabPressed: {
    opacity: 0.9,
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
