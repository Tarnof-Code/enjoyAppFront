import React, { useState } from 'react';
import { CheckBox } from '@rneui/themed';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function CheckList() {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);
  const [checked4, setChecked4] = useState(false);
  const [checked5, setChecked5] = useState(false);
  const [checked6, setChecked6] = useState(false);
  const [checked7, setChecked7] = useState(false);

  return (
    <SafeAreaProvider>
      <CheckBox
        checked={checked1}
        title="Téléphone chargé"
        checkedColor="#F94A56"
        onPress={() => {
          setChecked1(!checked1);
        }}
      />
      <CheckBox
        checked={checked2}
        title="Fiches sanitaires"
        checkedColor="#F94A56"
        onPress={() => {
          setChecked2(!checked2);
        }}
      />
      <CheckBox
        checked={checked3}
        title="Trousse à pharmacie"
        checkedColor="#F94A56"
        onPress={() => {
          setChecked3(!checked3);
        }}
      />
      <CheckBox
        checked={checked4}
        title="Traitements"
        checkedColor="#F94A56"
        onPress={() => {
          setChecked4(!checked4);
        }}
      />
      <CheckBox
        checked={checked5}
        title="Eau"
        checkedColor="#F94A56"
        onPress={() => {
          setChecked5(!checked5);
        }}
      />
      <CheckBox
        checked={checked6}
        title="Crème solaire"
        checkedColor="#F94A56"
        onPress={() => {
          setChecked6(!checked6);
        }}
      />
      <CheckBox
        checked={checked7}
        title="Pique-niques"
        checkedColor="#F94A56"
        onPress={() => {
          setChecked7(!checked7);
        }}
      />
    </SafeAreaProvider>
  );
}
