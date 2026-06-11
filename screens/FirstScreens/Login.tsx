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

import { getUserFacingErrorMessage } from '../../helpers/axiosError';
import type { RootStackParamList } from '../../Navigators/types';
import { accountService } from '../../services/account.service';
import { useAppDispatch } from '../../store/hooks';
import { setName as setAnimName } from '../../store/animNameSlice';
import { setUserFromProfil } from '../../store/authSlice';

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

  if (!fontsLoaded) {
    return null;
  }

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
      navigation.reset({
        index: 0,
        routes: [{ name: 'SejourPicker' }],
      });
    } catch (err) {
      setError(accountService.getApiLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}> Enjoy </Text>
        <Text style={styles.subTitle}> Connexion </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" color="#121851" size={26} />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
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
          <Ionicons name="lock-closed-outline" color="#121851" size={26} />
          <TextInput
            placeholder="Mot de passe"
            placeholderTextColor="#888"
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
            accessibilityLabel={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              color="#121851"
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
            <ActivityIndicator color="#ffffff" />
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
    backgroundColor: '#121851',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 100,
    color: 'white',
    fontFamily: 'DancingScript_400Regular',
    marginTop: 60,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 30,
    color: 'white',
    fontFamily: 'Roboto_400Regular',
    marginTop: 60,
    marginBottom: 30,
    textAlign: 'center',
  },
  error: {
    color: '#ffb8b8',
    fontFamily: 'PTSans_400Regular',
    marginBottom: 12,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontFamily: 'PTSans_400Regular',
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#121851',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'white',
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
    backgroundColor: '#F94A56',
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
    color: '#ffffff',
    fontFamily: 'Roboto_400Regular',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Login;
