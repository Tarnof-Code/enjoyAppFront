import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, radius, spacing } from '../config/theme';
import {
  cleNonParticipation,
  type ChoixResolutionConflitPrestataire,
  type ConflitActiviteAvecSortie,
} from '../helpers/activitePrestataireCalendrier';

const HAUTEUR_FEUILLE_RATIO = 0.92;

type ActiviteConflitSortieModalProps = {
  visible: boolean;
  submitting: boolean;
  error: string | null;
  conflits: ConflitActiviteAvecSortie[];
  choixParCle: Map<string, ChoixResolutionConflitPrestataire>;
  modeCreation: boolean;
  tousChoixFaits: boolean;
  onAppliquerChoix: (cle: string, choix: ChoixResolutionConflitPrestataire) => void;
  onFermer: () => void;
  onConfirmer: () => void;
};

export default function ActiviteConflitSortieModal({
  visible,
  submitting,
  error,
  conflits,
  choixParCle,
  modeCreation,
  tousChoixFaits,
  onAppliquerChoix,
  onFermer,
  onConfirmer,
}: ActiviteConflitSortieModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(windowHeight * HAUTEUR_FEUILLE_RATIO);
  const libelleActivite = modeCreation ? 'Créer l’activité' : 'Garder l’activité';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onFermer}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={submitting ? undefined : onFermer} />
        <View
          style={[
            styles.sheet,
            { maxHeight: sheetMaxHeight, paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.titre}>Conflit activité / sortie</Text>
            <Pressable
              onPress={onFermer}
              disabled={submitting}
              accessibilityLabel="Fermer"
              style={({ pressed }) => [styles.btnFermer, pressed && styles.btnPressed]}
            >
              <Text style={styles.btnFermerTexte}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.intro}>
            Pour chaque animateur concerné, une sortie est déjà planifiée sur le même créneau.
            Choisissez ce qui doit apparaître sur le calendrier.
          </Text>

          <ScrollView style={styles.liste} contentContainerStyle={styles.listeContenu}>
            {conflits.map((c) => {
              const cle = cleNonParticipation(c.tokenId, c.momentId);
              const choix = choixParCle.get(cle);
              const animateur =
                `${c.animateurPrenom} ${c.animateurNom}`.trim() || 'Animateur';
              return (
                <View key={cle} style={styles.item}>
                  <Text style={styles.itemTitre}>
                    {animateur} — {c.momentNom}
                  </Text>
                  <Text style={styles.itemDetail}>
                    Sortie : <Text style={styles.itemDetailGras}>{c.sortieNom}</Text>
                  </Text>
                  <View style={styles.itemActions}>
                    <Pressable
                      onPress={() => onAppliquerChoix(cle, 'sortie')}
                      disabled={submitting}
                      style={({ pressed }) => [
                        styles.btnChoix,
                        choix === 'sortie' && styles.btnChoixActif,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.btnChoixTexte,
                          choix === 'sortie' && styles.btnChoixTexteActif,
                        ]}
                      >
                        Afficher la sortie
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onAppliquerChoix(cle, 'activite')}
                      disabled={submitting}
                      style={({ pressed }) => [
                        styles.btnChoix,
                        styles.btnChoixSecondaire,
                        choix === 'activite' && styles.btnChoixSecondaireActif,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.btnChoixTexte,
                          choix === 'activite' && styles.btnChoixTexteActif,
                        ]}
                      >
                        {libelleActivite}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.footer}>
            <Pressable
              onPress={onFermer}
              disabled={submitting}
              style={({ pressed }) => [styles.btnFooter, styles.btnAnnuler, pressed && styles.btnPressed]}
            >
              <Text style={styles.btnAnnulerTexte}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={onConfirmer}
              disabled={submitting || !tousChoixFaits}
              style={({ pressed }) => [
                styles.btnFooter,
                styles.btnConfirmer,
                (submitting || !tousChoixFaits) && styles.btnFooterDisabled,
                pressed && styles.btnPressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <Text style={styles.btnConfirmerTexte}>Enregistrer</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titre: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  btnFermer: {
    padding: spacing.xs,
  },
  btnFermerTexte: {
    fontSize: fontSizes.lg,
    color: colors.muted,
  },
  intro: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  liste: {
    maxHeight: 320,
  },
  listeContenu: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  item: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  itemTitre: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.text,
  },
  itemDetail: {
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  itemDetailGras: {
    fontWeight: '700',
    color: colors.text,
  },
  itemActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btnChoix: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnChoixActif: {
    backgroundColor: colors.primary,
  },
  btnChoixSecondaire: {
    borderColor: colors.actionSecondary,
  },
  btnChoixSecondaireActif: {
    backgroundColor: colors.actionSecondary,
  },
  btnChoixTexte: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  btnChoixTexteActif: {
    color: colors.surface,
  },
  error: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btnFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  btnAnnuler: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnAnnulerTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
  },
  btnConfirmer: {
    backgroundColor: colors.primary,
  },
  btnConfirmerTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.surface,
  },
  btnFooterDisabled: {
    opacity: 0.5,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
