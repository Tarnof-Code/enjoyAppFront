import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView } from 'react-native';
import { Button } from '@rneui/themed';
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

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}> Enjoy </Text>
        <Text style={styles.subTitle}> Connexion </Text>

        <View style={styles.inputContainer}>
          <Ionicons name="people" color="#121851" size={30} />
          <TextInput
            placeholder="Nom de l'animateur"
            style={styles.input}
            value={name}
            onChangeText={(value) => setName(value)}
          />
        </View>

        <View style={{ alignItems: 'center' }}>
          <Button
            type="solid"
            buttonStyle={styles.button}
            title="Se connecter"
            onPress={() => {
              dispatch(setAnimName(name));
              navigation.navigate('BottomTab', { screen: 'Home' });
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#121851',
    alignItems: 'center',
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
    fontFamily: 'PTSans_400Regular',
    margin: 20,
    padding: 10,
    borderRadius: 5,
    width: 200,
    height: 40,
    backgroundColor: 'white',
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
    margin: 30,
    marginTop: 60,
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
