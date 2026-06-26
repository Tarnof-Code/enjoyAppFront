import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';

import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';

import { colors, fonts, fontSizes, radius } from '../config/theme';
import { navigationRef } from '../Navigators/navigationRef';
import { useAppSelector } from '../store/hooks';

interface HeaderProps {
  iconName: keyof typeof FontAwesome5.glyphMap;
  title: string;
}

function initiales(prenom: string | null, nom: string | null): string {
  const p = prenom?.trim().charAt(0) ?? '';
  const n = nom?.trim().charAt(0) ?? '';
  return (p + n).toUpperCase() || '?';
}

function Header({ iconName, title }: HeaderProps) {
  const { prenom, nom, photoProfilUri, photoProfilRevision } = useAppSelector((state) => state.auth);

  const ouvrirProfil = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Profil');
    }
  };

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.alignElements}>
        <View style={styles.iconContainer}>
          <FontAwesome5 style={styles.icon} name={iconName} size={27} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <TouchableOpacity
          onPress={ouvrirProfil}
          accessibilityRole="button"
          accessibilityLabel="Voir mon profil"
        >
          {photoProfilUri ? (
            <Image
              key={`photo-profil-${photoProfilRevision}`}
              source={{ uri: photoProfilUri }}
              style={styles.image}
            />
          ) : (
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{initiales(prenom, nom)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    backgroundColor: colors.surface,
    justifyContent: 'flex-end',
  },
  icon: {
    marginLeft: 15,
    marginBottom: 4,
  },
  alignElements: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 30,
    marginBottom: 9,
    color: colors.primary,
  },
  image: {
    width: 65,
    height: 65,
    borderRadius: radius.full,
    marginBottom: 7,
  },
  initialsCircle: {
    width: 65,
    height: 65,
    borderRadius: radius.full,
    marginBottom: 7,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: colors.surface,
    fontSize: fontSizes.xl,
    fontWeight: '700',
  },
  textContainer: {
    width: '60%',
  },
  iconContainer: {
    width: '15%',
  },
});

export default Header;
