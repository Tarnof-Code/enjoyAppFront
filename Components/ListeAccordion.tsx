import React, { type ReactNode } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../config/theme';

type ListeAccordionProps = {
  ouvert: boolean;
  onToggle: () => void;
  entete: ReactNode;
  corps?: ReactNode;
};

export function ListeAccordion({ ouvert, onToggle, entete, corps }: ListeAccordionProps) {
  return (
    <View style={[styles.card, ouvert && styles.cardOuverte]}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.entete, pressed && styles.entetePressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: ouvert }}
      >
        <MaterialIcons
          name={ouvert ? 'expand-more' : 'chevron-right'}
          size={24}
          color={colors.primary}
          style={styles.chevron}
        />
        <View style={styles.enteteContenu}>{entete}</View>
      </Pressable>

      {ouvert && corps != null ? <View style={styles.corps}>{corps}</View> : null}
    </View>
  );
}

export const listeAccordionStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardOuverte: {
    borderColor: colors.primarySoft,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
    paddingLeft: 8,
  },
  entetePressed: {
    backgroundColor: colors.primarySoft,
  },
  chevron: {
    marginRight: 4,
  },
  enteteContenu: {
    flex: 1,
  },
  corps: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  ligneTitre: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titre: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  badge: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    flexShrink: 0,
    maxWidth: '40%',
    textAlign: 'right',
  },
  sousTitre: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
  },
  ligneListe: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  ligneListeNom: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  vide: {
    fontSize: 14,
    color: colors.muted,
    fontStyle: 'italic',
  },
});

const styles = listeAccordionStyles;
