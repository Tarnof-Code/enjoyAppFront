import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../config/theme';

interface EcranListeFondProps {
  children: React.ReactNode;
}

/** Fond uni pour écrans listes et orga (aligné avec la bande de filtres). */
function EcranListeFond({ children }: EcranListeFondProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});

export default EcranListeFond;
