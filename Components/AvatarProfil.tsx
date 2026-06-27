import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../config/theme';

function initiales(prenom: string, nom: string): string {
  const p = prenom.trim().charAt(0) ?? '';
  const n = nom.trim().charAt(0) ?? '';
  return (p + n).toUpperCase() || '?';
}

interface AvatarProfilProps {
  prenom: string;
  nom: string;
  uri?: string | null;
  size?: number;
}

function AvatarProfil({ prenom, nom, uri, size = 44 }: AvatarProfilProps) {
  const fontSize = Math.round(size * 0.38);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.photo, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.initiales,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initialesTexte, { fontSize }]}>{initiales(prenom, nom)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    backgroundColor: colors.border,
  },
  initiales: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialesTexte: {
    color: colors.surface,
    fontWeight: '700',
  },
});

export default AvatarProfil;
