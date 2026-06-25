import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, fontSizes, radius, spacing } from '../config/theme';

export function LigneInfoFiche({
  libelle,
  valeur,
  onPress,
}: {
  libelle: string;
  valeur: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.infoLigne}>
      <Text style={styles.infoLibelle}>{libelle}</Text>
      {onPress ? (
        <Text style={[styles.infoValeur, styles.infoValeurLien]} onPress={onPress}>
          {valeur}
        </Text>
      ) : (
        <Text style={styles.infoValeur}>{valeur}</Text>
      )}
    </View>
  );
}

interface FichePersonneModalProps {
  visible: boolean;
  onFermer: () => void;
  prenom: string;
  nom: string;
  sousTitre: string;
  children: React.ReactNode;
  aucuneInfo?: boolean;
}

export default function FichePersonneModal({
  visible,
  onFermer,
  prenom,
  nom,
  sousTitre,
  children,
  aucuneInfo = false,
}: FichePersonneModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={styles.modalOverlay} onPress={onFermer}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalNom}>
            {prenom} {nom.toUpperCase()}
          </Text>
          <Text style={styles.modalRole}>{sousTitre}</Text>

          <ScrollView style={styles.modalCorps} contentContainerStyle={styles.modalCorpsContenu}>
            {children}
            {aucuneInfo ? (
              <Text style={styles.modalAucuneInfo}>Aucune information complémentaire.</Text>
            ) : null}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [styles.modalFermer, pressed && styles.modalFermerPressed]}
            onPress={onFermer}
          >
            <Text style={styles.modalFermerTexte}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  modalCard: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.xl,
  },
  modalNom: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  modalRole: {
    marginTop: spacing.xs,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  modalCorps: {
    marginTop: spacing.lg,
  },
  modalCorpsContenu: {
    gap: spacing.md,
  },
  infoLigne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoLibelle: {
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  infoValeur: {
    flexShrink: 1,
    fontSize: fontSizes.sm,
    color: colors.text,
    textAlign: 'right',
  },
  infoValeurLien: {
    color: colors.link,
    fontWeight: '600',
  },
  modalAucuneInfo: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    fontStyle: 'italic',
  },
  modalFermer: {
    marginTop: spacing.xl,
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  modalFermerPressed: {
    backgroundColor: colors.primaryDark,
  },
  modalFermerTexte: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
});
