import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../config/theme';

interface Props {
  actif: boolean;
  onPress: () => void;
}

export default function BoutonModePaysageGrille({ actif, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, actif && styles.btnActif, pressed && styles.btnPressed]}
      accessibilityRole="button"
      accessibilityLabel={actif ? 'Afficher le tableau en portrait' : 'Afficher le tableau en paysage'}
    >
      <MaterialIcons
        name="screen-rotation"
        size={22}
        color={actif ? colors.surface : colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActif: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
