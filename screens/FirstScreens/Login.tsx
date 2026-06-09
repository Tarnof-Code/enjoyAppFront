import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';
import { Roboto_400Regular } from '@expo-google-fonts/roboto';
import { PTSans_400Regular } from '@expo-google-fonts/pt-sans';

import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch } from '../../store/hooks';
import { setName as setAnimName } from '../../store/animNameSlice';
import type { RootStackParamList } from '../../Navigators/types';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

function Login({ navigation }: LoginScreenProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [checked, setChecked] = useState(false);

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
    Roboto_400Regular,
    PTSans_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleLogin = () => {
    dispatch(setAnimName(name.trim()));
    navigation.navigate('BottomTab', { screen: 'Home' });
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

        <View style={styles.inputContainer}>
          <Ionicons name="people" color="#121851" size={30} />
          <TextInput
            placeholder="Nom de l'animateur"
            placeholderTextColor="#888"
            style={styles.input}
            value={name}
            onChangeText={setName}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
        </View>

        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Se connecter</Text>
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
  input: {
    flex: 1,
    fontFamily: 'PTSans_400Regular',
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#121851',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'white',
    marginTop: 20,
    paddingLeft: 10,
    paddingRight: 20,
    borderRadius: 8,
    height: 50,
    width: 300,
  },
  button: {
    borderRadius: 40,
    backgroundColor: '#F94A56',
    width: 180,
    height: 50,
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontFamily: 'Roboto_400Regular',
    fontSize: 16,
    fontWeight: '600',
  },
  checkboxContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginLeft: -10,
    marginTop: 10,
  },
  textCheckbox: {
    color: '#ffffff',
    fontFamily: 'PTSans_400Regular',
    marginLeft: -20,
  },
});

export default Login;
