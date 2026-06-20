import React, { useState } from 'react';
import { CheckBox } from '@rneui/themed';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '../config/theme';

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
        checkedColor={colors.danger}
        onPress={() => {
          setChecked1(!checked1);
        }}
      />
      <CheckBox
        checked={checked2}
        title="Fiches sanitaires"
        checkedColor={colors.danger}
        onPress={() => {
          setChecked2(!checked2);
        }}
      />
      <CheckBox
        checked={checked3}
        title="Trousse à pharmacie"
        checkedColor={colors.danger}
        onPress={() => {
          setChecked3(!checked3);
        }}
      />
      <CheckBox
        checked={checked4}
        title="Traitements"
        checkedColor={colors.danger}
        onPress={() => {
          setChecked4(!checked4);
        }}
      />
      <CheckBox
        checked={checked5}
        title="Eau"
        checkedColor={colors.danger}
        onPress={() => {
          setChecked5(!checked5);
        }}
      />
      <CheckBox
        checked={checked6}
        title="Crème solaire"
        checkedColor={colors.danger}
        onPress={() => {
          setChecked6(!checked6);
        }}
      />
      <CheckBox
        checked={checked7}
        title="Pique-niques"
        checkedColor={colors.danger}
        onPress={() => {
          setChecked7(!checked7);
        }}
      />
    </SafeAreaProvider>
  );
}
