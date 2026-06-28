import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';
import { LinearGradient } from 'expo-linear-gradient';

import AvatarProfil from './AvatarProfil';
import GlassPanel from './GlassPanel';
import { colors, fonts, radius, spacing } from '../config/theme';
import { navigationRef } from '../Navigators/navigationRef';
import { useAppSelector } from '../store/hooks';

interface HeaderProps {
  iconName: keyof typeof FontAwesome5.glyphMap;
  title: string;
}

const AVATAR_SIZE = 44;
const HEADER_CONTENT_MIN = 52;

function Header({ iconName, title }: HeaderProps) {
  const insets = useSafeAreaInsets();
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
    return (
      <View style={[styles.placeholder, { paddingTop: insets.top, minHeight: insets.top + HEADER_CONTENT_MIN }]} />
    );
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, '#2a2d8a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.orbAccent} pointerEvents="none" />
      <View
        style={[
          styles.inner,
          {
            paddingTop: insets.top,
            minHeight: insets.top + HEADER_CONTENT_MIN,
          },
        ]}
      >
        <View style={styles.alignElements}>
          <View style={styles.iconContainer}>
            <FontAwesome5 name={iconName} size={24} color={colors.surface} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
          </View>
          <Pressable
            onPress={ouvrirProfil}
            accessibilityRole="button"
            accessibilityLabel="Voir mon profil"
            hitSlop={8}
            style={styles.avatarWrap}
          >
            <GlassPanel borderRadius={radius.full} intensity={45} style={styles.avatarRing}>
              <AvatarProfil
                key={`header-photo-profil-${photoProfilRevision}`}
                prenom={prenom ?? ''}
                nom={nom ?? ''}
                uri={photoProfilUri}
                size={AVATAR_SIZE}
              />
            </GlassPanel>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primaryDark,
  },
  placeholder: {
    backgroundColor: colors.primary,
  },
  orbAccent: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  inner: {
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  alignElements: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -2,
  },
  iconContainer: {
    width: '15%',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 28,
    lineHeight: 32,
    color: colors.surface,
  },
  avatarWrap: {
    marginTop: -1,
  },
  avatarRing: {
    padding: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default Header;
