import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../config/theme';

export default function WhatToDoIf() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Que faire si...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    color: colors.surface,
  },
});
