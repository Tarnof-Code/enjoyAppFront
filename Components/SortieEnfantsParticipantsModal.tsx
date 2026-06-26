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
  enfantActiviteCorrespondRecherche,
  idsEnfantsDejaAffectesAutreEvenement,
} from '../helpers/activiteUtils';
import { datePrestataireVersYmd } from '../helpers/activitePrestataireCalendrier';
import { libelleEnfantDuSejour, trierEnfantsDuSejour } from '../helpers/triListesSejour';
import type {
  ActiviteDto,
  ActivitePrestataireDto,
  EnfantDto,
  GroupeDto,
  MomentDto,
  SejourDTO,
} from '../types/api';

const HAUTEUR_FEUILLE_RATIO = 0.92;

type SortieEnfantsParticipantsModalProps = {
  visible: boolean;
  sejour: SejourDTO;
  sortie: ActivitePrestataireDto | null;
  groupes: GroupeDto[];
  enfantsDuSejour: EnfantDto[];
  activitesInternes: ActiviteDto[];
  activitesPrestataires: ActivitePrestataireDto[];
  moments: MomentDto[];
  selectedEnfantIds: ReadonlySet<number>;
  chargement?: boolean;
  submitting: boolean;
  error: string | null;
  onToggleEnfant: (enfantId: number) => void;
  onFermer: () => void;
  onEnregistrer: () => void;
};

export default function SortieEnfantsParticipantsModal({
  visible,
  sejour,
  sortie,
  groupes,
  enfantsDuSejour,
  activitesInternes,
  activitesPrestataires,
  moments,
  selectedEnfantIds,
  chargement = false,
  submitting,
  error,
  onToggleEnfant,
  onFermer,
  onEnregistrer,
}: SortieEnfantsParticipantsModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(windowHeight * HAUTEUR_FEUILLE_RATIO);

  const [editionOuverte, setEditionOuverte] = useState(false);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    if (!visible) return;
    setEditionOuverte(false);
    setRecherche('');
  }, [visible, sortie?.id]);

  const libellesGroupesSortie =
    sortie?.groupeIds
      ?.map((id) => groupes.find((g) => g.id === id)?.nom)
      .filter(Boolean)
      .join(', ') ?? '';

  const enfantsEligibles = useMemo(
    () => trierEnfantsDuSejour(enfantsDuSejour, sejour),
    [enfantsDuSejour, sejour],
  );

  const enfantsEligiblesFiltres = useMemo(
    () => enfantsEligibles.filter((e) => enfantActiviteCorrespondRecherche(recherche, e)),
    [enfantsEligibles, recherche],
  );

  const participantsSelectionnes = useMemo(() => {
    if (!sortie) return [];
    const byId = new Map<number, { prenom: string; nom: string }>();
    for (const e of enfantsDuSejour) {
      byId.set(e.id, { prenom: e.prenom, nom: e.nom });
    }
    const bruts = [...selectedEnfantIds]
      .map((id) => {
        const e = byId.get(id);
        return e ? { id, ...e } : null;
      })
      .filter((e): e is { id: number; prenom: string; nom: string } => e != null);
    return trierEnfantsDuSejour(bruts, sejour);
  }, [sortie, enfantsDuSejour, selectedEnfantIds, sejour]);

  const momentIdsSortie = useMemo(
    () => (sortie?.moments ?? []).map((m) => m.id),
    [sortie?.moments],
  );

  const enfantsDejaAffectes = useMemo(() => {
    if (!sortie || momentIdsSortie.length === 0) {
      return new Map<number, { activiteNom: string; momentNom: string }>();
    }
    return idsEnfantsDejaAffectesAutreEvenement(
      activitesInternes,
      activitesPrestataires,
      datePrestataireVersYmd(sortie.date),
      momentIdsSortie,
      moments,
      { excludePrestataireId: sortie.id },
    );
  }, [sortie, momentIdsSortie, activitesInternes, activitesPrestataires, moments]);

  const formulaireDesactive = submitting || chargement;

  const handleFermer = () => {
    if (submitting) return;
    onFermer();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleFermer}>
      <View style={styles.root}>
        <Pressable style={styles.zoneFermer} onPress={handleFermer} accessibilityLabel="Fermer" />

        <View style={[styles.sheet, { maxHeight: sheetMaxHeight }]}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContenu,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            <Text style={styles.titre}>
              Enfants participants
              {sortie ? ` — ${sortie.nom}` : ''}
            </Text>

            {!sortie ? null : chargement ? (
              <View style={styles.chargement}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.chargementTexte}>Chargement des participants…</Text>
              </View>
            ) : (
              <>
                <Text style={styles.intro}>
                  {editionOuverte ? (
                    <>
                      Tous les enfants inscrits au séjour sont listés ci-dessous. Vous pouvez retirer
                      des participants ou en ajouter, quel que soit leur groupe.
                    </>
                  ) : (
                    <>
                      Par défaut, les enfants des groupes prévus pour cette sortie
                      {libellesGroupesSortie ? (
                        <>
                          {' '}
                          (<Text style={styles.introStrong}>{libellesGroupesSortie}</Text>)
                        </>
                      ) : null}{' '}
                      sont retenus. Appuyez sur « Modifier la sélection » pour ajuster la liste (tous
                      groupes confondus).
                    </>
                  )}
                </Text>

                <Text style={styles.label}>
                  Participants actuels ({participantsSelectionnes.length})
                </Text>
                {participantsSelectionnes.length === 0 ? (
                  <Text style={styles.hint}>Aucun enfant participant pour le moment.</Text>
                ) : (
                  <View style={styles.listeActuelle}>
                    {participantsSelectionnes.map((e) => (
                      <Text key={e.id} style={styles.ligneActuelle}>
                        {libelleEnfantDuSejour(e, sejour)}
                      </Text>
                    ))}
                  </View>
                )}

                {!editionOuverte ? (
                  <Pressable
                    onPress={() => setEditionOuverte(true)}
                    disabled={formulaireDesactive}
                    style={({ pressed }) => [
                      styles.btnModifierSelection,
                      pressed && !formulaireDesactive && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.btnModifierSelectionTexte}>Modifier la sélection</Text>
                  </Pressable>
                ) : null}

                {editionOuverte ? (
                  <>
                    <Text style={styles.label}>Sélection</Text>
                    <TextInput
                      style={styles.recherche}
                      value={recherche}
                      onChangeText={setRecherche}
                      placeholder="Rechercher un enfant…"
                      placeholderTextColor={colors.placeholder}
                      editable={!formulaireDesactive}
                      autoCorrect={false}
                    />
                    {enfantsEligibles.length === 0 ? (
                      <Text style={styles.hint}>Aucun enfant inscrit au séjour.</Text>
                    ) : enfantsEligiblesFiltres.length === 0 ? (
                      <Text style={styles.hint}>Aucun enfant ne correspond à la recherche.</Text>
                    ) : (
                      enfantsEligiblesFiltres.map((enfant) => {
                        const conflit = enfantsDejaAffectes.get(enfant.id);
                        const selected = selectedEnfantIds.has(enfant.id);
                        const indisponible = conflit != null && !selected;
                        return (
                          <Pressable
                            key={enfant.id}
                            disabled={formulaireDesactive || indisponible}
                            onPress={() => onToggleEnfant(enfant.id)}
                            style={({ pressed }) => [
                              styles.ligneSelection,
                              indisponible && styles.ligneSelectionIndisponible,
                              pressed && !formulaireDesactive && !indisponible && styles.ligneSelectionPressed,
                            ]}
                          >
                            <MaterialIcons
                              name={selected ? 'check-box' : 'check-box-outline-blank'}
                              size={22}
                              color={
                                indisponible ? colors.disabled : selected ? colors.primary : colors.muted
                              }
                            />
                            <View style={styles.ligneSelectionTexte}>
                              <Text
                                style={[
                                  styles.ligneSelectionLabel,
                                  indisponible && styles.ligneSelectionLabelIndisponible,
                                ]}
                              >
                                {libelleEnfantDuSejour(enfant, sejour)}
                              </Text>
                              {indisponible && conflit ? (
                                <Text style={styles.conflitHint}>
                                  Déjà sur « {conflit.activiteNom} » ({conflit.momentNom})
                                </Text>
                              ) : null}
                            </View>
                          </Pressable>
                        );
                      })
                    )}
                    {enfantsEligibles.length > 0 && enfantsDejaAffectes.size > 0 ? (
                      <Text style={styles.hintConflit}>
                        Les enfants grisés participent déjà à une autre activité ou sortie sur ce
                        créneau (ou un moment qui se chevauche).
                      </Text>
                    ) : null}
                  </>
                ) : null}
              </>
            )}

            {error ? <Text style={styles.erreur}>{error}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                onPress={handleFermer}
                disabled={submitting}
                style={({ pressed }) => [styles.btnSecondaire, pressed && styles.btnPressed]}
              >
                <Text style={styles.btnSecondaireTexte}>
                  {editionOuverte ? 'Annuler' : 'Fermer'}
                </Text>
              </Pressable>
              {editionOuverte ? (
                <Pressable
                  onPress={onEnregistrer}
                  disabled={formulaireDesactive || !sortie}
                  style={({ pressed }) => [
                    styles.btnPrimaire,
                    formulaireDesactive && styles.btnDisabled,
                    pressed && !formulaireDesactive && styles.btnPressed,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.surface} size="small" />
                  ) : (
                    <Text style={styles.btnPrimaireTexte}>Enregistrer</Text>
                  )}
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
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
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContenu: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  titre: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  intro: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    lineHeight: 20,
  },
  introStrong: {
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  hint: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    fontStyle: 'italic',
  },
  hintConflit: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  listeActuelle: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  ligneActuelle: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  btnModifierSelection: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  btnModifierSelectionTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  recherche: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  ligneSelection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  ligneSelectionIndisponible: {
    opacity: 0.55,
  },
  ligneSelectionPressed: {
    backgroundColor: colors.background,
  },
  ligneSelectionTexte: {
    flex: 1,
    gap: 2,
  },
  ligneSelectionLabel: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  ligneSelectionLabelIndisponible: {
    color: colors.muted,
  },
  conflitHint: {
    fontSize: fontSizes.xs,
    color: colors.muted,
  },
  chargement: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  chargementTexte: {
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  erreur: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btnSecondaire: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  btnSecondaireTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
  },
  btnPrimaire: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  btnPrimaireTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.surface,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
