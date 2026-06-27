import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { estContenuTipTapVide } from '../helpers/reunionTipTapTexte';
import type { ReunionContenuTipTapJson } from '../types/api';
import { colors, fonts, fontSizes, spacing } from '../config/theme';
import ReunionContenuTipTap from './ReunionContenuTipTap';

interface CompteRenduPleinEcranModalProps {
  visible: boolean;
  titre: string;
  ordreDuJour: string;
  contenu: ReunionContenuTipTapJson | null;
  onClose: () => void;
}

function CompteRenduPleinEcranModal({
  visible,
  titre,
  ordreDuJour,
  contenu,
  onClose,
}: CompteRenduPleinEcranModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.titre} numberOfLines={2}>{titre}</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fermer la réunion"
          >
            <Ionicons name="close" size={28} color={colors.ink} />
          </Pressable>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
        >
          {ordreDuJour ? (
            <View style={styles.odjBloc}>
              <Text style={styles.odjLabel}>Ordre du jour</Text>
              <Text style={styles.odjTexte}>{ordreDuJour}</Text>
            </View>
          ) : null}
          {!estContenuTipTapVide(contenu) ? (
            <ReunionContenuTipTap contenu={contenu} />
          ) : (
            <Text style={styles.vide}>Réunion vide.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titre: {
    flex: 1,
    fontFamily: fonts.body,
    fontWeight: '700',
    fontSize: fontSizes.lg,
    lineHeight: 22,
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  odjBloc: {
    marginBottom: spacing.lg,
  },
  odjLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  odjTexte: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    lineHeight: 20,
    color: colors.ink,
  },
  vide: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});

export default CompteRenduPleinEcranModal;
