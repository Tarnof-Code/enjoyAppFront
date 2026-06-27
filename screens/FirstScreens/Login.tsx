import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';
import { Roboto_400Regular } from '@expo-google-fonts/roboto';
import { PTSans_400Regular } from '@expo-google-fonts/pt-sans';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { RootStackParamList } from '../../Navigators/types';
import { accountService } from '../../services/account.service';
import { useAppDispatch } from '../../store/hooks';
import { setName as setAnimName } from '../../store/animNameSlice';
import { setUserFromProfil } from '../../store/authSlice';
import { clearSejour } from '../../store/sejourSlice';
import { colors, fonts, radius } from '../../config/theme';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

function Login({ navigation }: LoginScreenProps) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
    Roboto_400Regular,
    PTSans_400Regular,
  });

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await accountService.login({ email: trimmedEmail, password });
      const profil = await accountService.fetchProfil();
      dispatch(
        setUserFromProfil({
          tokenId: profil.tokenId,
          role: String(profil.role),
          prenom: profil.prenom,
          nom: profil.nom,
          genre: profil.genre,
        }),
      );
      dispatch(setAnimName(profil.prenom.trim().toUpperCase()));
      dispatch(clearSejour());
      navigation.reset({
        index: 0,
        routes: [{ name: 'BottomTab', params: { screen: 'Home' } }],
      });
    } catch (err) {
      setError(accountService.getApiLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={colors.surface} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, '#2a2d8a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.orbTop} pointerEvents="none" />
      <View style={styles.orbBottom} pointerEvents="none" />
      <View style={styles.shine} pointerEvents="none" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}> Enjoy </Text>
        <Text style={styles.subTitle}> Connexion </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" color={colors.primary} size={26} />
          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" color={colors.primary} size={26} />
          <TextInput
            placeholder="Mot de passe"
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={() => void handleLogin()}
          />
          <Pressable
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={8}
            accessibilityLabel={
              passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
            }
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              color={colors.primary}
              size={22}
            />
          </Pressable>
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => void handleLogin()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  orbTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: 120,
    left: -90,
    width: 280,
    height: 280,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  title: {
    fontSize: 100,
    color: colors.surface,
    fontFamily: fonts.script,
    marginTop: 60,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 30,
    color: colors.surface,
    fontFamily: fonts.body,
    marginTop: 60,
    marginBottom: 30,
    textAlign: 'center',
  },
  error: {
    color: colors.dangerSoft,
    fontFamily: fonts.sans,
    marginBottom: 12,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    marginTop: 16,
    paddingLeft: 10,
    paddingRight: 12,
    borderRadius: 8,
    height: 50,
    width: 300,
    gap: 6,
  },
  button: {
    borderRadius: 40,
    backgroundColor: colors.danger,
    width: 180,
    height: 50,
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.surface,
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
});

export default Login;
