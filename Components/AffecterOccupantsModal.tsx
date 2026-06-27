import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, radius, spacing } from '../config/theme';
import {
  enfantsEligiblesPourChambre,
  indexerAffectationsOccupants,
  libelleChambre,
  membresEligiblesPourChambre,
  trierMembresEligibles,
  type MembreEquipePourChambre,
} from '../helpers/chambreOccupantsUtils';
import { libelleEnfantDuSejour, libelleEquipeDuSejour, trierEnfantsDuSejour } from '../helpers/triListesSejour';
import type { ChambreDto, EnfantDto, GroupeDto, SejourDTO } from '../types/api';

const HAUTEUR_FEUILLE_RATIO = 0.92;

type AffecterOccupantsModalProps = {
  visible: boolean;
  chambre: ChambreDto | null;
  chambres: ChambreDto[];
  enfants: EnfantDto[];
  groupes: GroupeDto[];
  equipe: MembreEquipePourChambre[];
  sejour: SejourDTO | null;
  submitting: boolean;
  onFermer: () => void;
  onAffecter: (selection: { enfantIds: number[]; membreTokenIds: string[] }) => void;
};

function normaliser(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

export default function AffecterOccupantsModal({
  visible,
  chambre,
  chambres,
  enfants,
  groupes,
  equipe,
  sejour,
  submitting,
  onFermer,
  onAffecter,
}: AffecterOccupantsModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = windowHeight * HAUTEUR_FEUILLE_RATIO;

  const [recherche, setRecherche] = useState('');
  const [enfantIdsSelectionnes, setEnfantIdsSelectionnes] = useState<Set<number>>(() => new Set());
  const [membreIdsSelectionnes, setMembreIdsSelectionnes] = useState<Set<string>>(() => new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setRecherche('');
    setEnfantIdsSelectionnes(new Set());
    setMembreIdsSelectionnes(new Set());
    setErrorMessage(null);
  }, [visible, chambre?.id]);

  const affectationIndex = useMemo(() => indexerAffectationsOccupants(chambres), [chambres]);

  const placesRestantes = chambre
    ? Math.max(0, chambre.capaciteMax - (chambre.occupants?.length ?? 0))
    : 0;

  const candidatsEnfants = useMemo(() => {
    if (!chambre || chambre.typeChambre !== 'ENFANT') return [];
    const idsDansChambre = new Set(
      (chambre.occupants ?? [])
        .filter((o) => o.enfantId != null)
        .map((o) => o.enfantId as number),
    );
    const terme = normaliser(recherche);
    return trierEnfantsDuSejour(
      enfantsEligiblesPourChambre(chambre, enfants, idsDansChambre, groupes),
      sejour,
    ).filter((enfant) => {
      if (terme === '') return true;
      return normaliser(`${enfant.prenom} ${enfant.nom}`).includes(terme);
    });
  }, [chambre, enfants, groupes, recherche, sejour]);

  const candidatsMembres = useMemo(() => {
    if (!chambre || chambre.typeChambre !== 'EQUIPE') return [];
    const idsDansChambre = new Set(
      (chambre.occupants ?? [])
        .filter((o) => o.membreTokenId?.trim())
        .map((o) => o.membreTokenId!.trim()),
    );
    const terme = normaliser(recherche);
    return trierMembresEligibles(membresEligiblesPourChambre(chambre, equipe, idsDansChambre), sejour).filter(
      (membre) => {
        if (terme === '') return true;
        return normaliser(`${membre.prenom} ${membre.nom}`).includes(terme);
      },
    );
  }, [chambre, equipe, recherche, sejour]);

  const toggleEnfant = (enfantId: number) => {
    if (!chambre) return;
    setEnfantIdsSelectionnes((prev) => {
      const next = new Set(prev);
      if (next.has(enfantId)) {
        next.delete(enfantId);
        setErrorMessage(null);
        return next;
      }
      if (next.size >= placesRestantes) return prev;
      next.add(enfantId);
      setErrorMessage(null);
      return next;
    });
  };

  const toggleMembre = (membreTokenId: string) => {
    if (!chambre) return;
    const tid = membreTokenId.trim();
    setMembreIdsSelectionnes((prev) => {
      const next = new Set(prev);
      if (next.has(tid)) {
        next.delete(tid);
        setErrorMessage(null);
        return next;
      }
      if (next.size >= placesRestantes) return prev;
      next.add(tid);
      setErrorMessage(null);
      return next;
    });
  };

  const handleAffecter = () => {
    if (!chambre) return;
    if (chambre.typeChambre === 'ENFANT') {
      const ids = Array.from(enfantIdsSelectionnes);
      if (ids.length === 0) {
        setErrorMessage('Sélectionnez au moins un enfant.');
        return;
      }
      if (ids.length > placesRestantes) {
        setErrorMessage(
          `Impossible d'affecter ${ids.length} enfant(s) : il reste ${placesRestantes} place(s).`,
        );
        return;
      }
      onAffecter({ enfantIds: ids, membreTokenIds: [] });
      return;
    }

    const tokenIds = Array.from(membreIdsSelectionnes);
    if (tokenIds.length === 0) {
      setErrorMessage("Sélectionnez au moins un membre d'équipe.");
      return;
    }
    if (tokenIds.length > placesRestantes) {
      setErrorMessage(
        `Impossible d'affecter ${tokenIds.length} membre(s) : il reste ${placesRestantes} place(s).`,
      );
      return;
    }
    onAffecter({ enfantIds: [], membreTokenIds: tokenIds });
  };

  if (!chambre) return null;

  const selectionCount =
    chambre.typeChambre === 'ENFANT' ? enfantIdsSelectionnes.size : membreIdsSelectionnes.size;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      <View style={styles.root}>
        <Pressable
          style={styles.zoneFermer}
          onPress={() => !submitting && onFermer()}
          accessibilityLabel="Fermer"
        />

        <View style={[styles.sheet, { height: sheetHeight }]}>
          <View style={styles.entete}>
            <Text style={styles.titre}>Affecter à {libelleChambre(chambre)}</Text>
            <Text style={styles.meta}>
              {placesRestantes} place{placesRestantes !== 1 ? 's' : ''} restante
              {placesRestantes !== 1 ? 's' : ''} — {selectionCount} sélectionné
              {selectionCount !== 1 ? 's' : ''}
            </Text>

            <TextInput
              style={styles.recherche}
              value={recherche}
              onChangeText={setRecherche}
              editable={!submitting}
              placeholder="Nom ou prénom…"
              placeholderTextColor={colors.placeholder}
              autoCorrect={false}
            />
          </View>

          <ScrollView
            style={styles.liste}
            contentContainerStyle={styles.listeContenu}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            bounces
          >
            {chambre.typeChambre === 'ENFANT' ? (
              candidatsEnfants.length === 0 ? (
                <Text style={styles.vide}>
                  {chambre.groupe
                    ? `Aucun enfant éligible du groupe « ${chambre.groupe.libelle} ».`
                    : 'Aucun enfant éligible (genre compatible, non déjà dans cette chambre).'}
                </Text>
              ) : (
                candidatsEnfants.map((enfant) => {
                  const autreChambre = affectationIndex.enfantIdVersChambre.get(enfant.id);
                  const deplace = autreChambre != null && autreChambre.id !== chambre.id;
                  const selected = enfantIdsSelectionnes.has(enfant.id);
                  const selectionPleine = !selected && enfantIdsSelectionnes.size >= placesRestantes;
                  return (
                    <Pressable
                      key={enfant.id}
                      style={({ pressed }) => [
                        styles.ligne,
                        selected && styles.ligneSelectionnee,
                        selectionPleine && styles.ligneDesactivee,
                        pressed && !selectionPleine && styles.lignePressed,
                      ]}
                      onPress={() => !submitting && !selectionPleine && toggleEnfant(enfant.id)}
                      disabled={submitting || selectionPleine}
                    >
                      <MaterialIcons
                        name={selected ? 'check-box' : 'check-box-outline-blank'}
                        size={22}
                        color={selected ? colors.primary : colors.muted}
                      />
                      <View style={styles.ligneContenu}>
                        <Text style={styles.ligneNom}>{libelleEnfantDuSejour(enfant, sejour)}</Text>
                        {deplace ? (
                          <Text style={styles.ligneHint}>
                            Actuellement : {libelleChambre(autreChambre!)} — sera déplacé
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })
              )
            ) : candidatsMembres.length === 0 ? (
              <Text style={styles.vide}>
                {chambre.genreAutorise === 'MIXTE'
                  ? "Aucun membre d'équipe disponible."
                  : 'Aucun membre compatible avec le genre autorisé.'}
              </Text>
            ) : (
              candidatsMembres.map((membre) => {
                const tid = membre.tokenId.trim();
                const autreChambre = affectationIndex.membreTokenIdVersChambre.get(tid);
                const deplace = autreChambre != null && autreChambre.id !== chambre.id;
                const selected = membreIdsSelectionnes.has(tid);
                const selectionPleine = !selected && membreIdsSelectionnes.size >= placesRestantes;
                return (
                  <Pressable
                    key={membre.tokenId}
                    style={({ pressed }) => [
                      styles.ligne,
                      selected && styles.ligneSelectionnee,
                      selectionPleine && styles.ligneDesactivee,
                      pressed && !selectionPleine && styles.lignePressed,
                    ]}
                    onPress={() => !submitting && !selectionPleine && toggleMembre(tid)}
                    disabled={submitting || selectionPleine}
                  >
                    <MaterialIcons
                      name={selected ? 'check-box' : 'check-box-outline-blank'}
                      size={22}
                      color={selected ? colors.primary : colors.muted}
                    />
                    <View style={styles.ligneContenu}>
                      <Text style={styles.ligneNom}>{libelleEquipeDuSejour(membre, sejour)}</Text>
                      {deplace ? (
                        <Text style={styles.ligneHint}>
                          Actuellement : {libelleChambre(autreChambre!)} — sera déplacé
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <View style={[styles.pied, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            {errorMessage ? <Text style={styles.erreur}>{errorMessage}</Text> : null}
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.boutonSecondaire, pressed && styles.boutonPressed]}
                onPress={onFermer}
                disabled={submitting}
              >
                <Text style={styles.boutonSecondaireTexte}>Annuler</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.boutonPrincipal,
                  (submitting || selectionCount === 0) && styles.boutonDesactive,
                  pressed && !submitting && selectionCount > 0 && styles.boutonPressed,
                ]}
                onPress={handleAffecter}
                disabled={submitting || selectionCount === 0}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.boutonPrincipalTexte}>Affecter ({selectionCount})</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  zoneFermer: {
    flex: 1,
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: 'hidden',
  },
  entete: {
    flexShrink: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  titre: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    marginTop: spacing.xs,
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  recherche: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  liste: {
    flex: 1,
  },
  listeContenu: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  ligneSelectionnee: {
    backgroundColor: colors.primarySoft,
  },
  ligneDesactivee: {
    opacity: 0.45,
  },
  lignePressed: {
    backgroundColor: colors.background,
  },
  ligneContenu: {
    flex: 1,
  },
  ligneNom: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  ligneHint: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    color: colors.muted,
    fontStyle: 'italic',
  },
  vide: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
  pied: {
    flexShrink: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  erreur: {
    marginBottom: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  boutonSecondaire: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boutonPrincipal: {
    minWidth: 130,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  boutonDesactive: {
    opacity: 0.5,
  },
  boutonPressed: {
    opacity: 0.85,
  },
  boutonSecondaireTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
  },
  boutonPrincipalTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.surface,
  },
});
