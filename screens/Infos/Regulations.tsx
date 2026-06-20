import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../config/theme';

export default function Regulations() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Réglementation</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    color: colors.surface,
  },
});
