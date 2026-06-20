import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

import { colors } from '../config/theme';
import { AntDesign } from '@expo/vector-icons';

const data = [
  { label: 'A1     EMY           ', value: 'A1' },
  { label: 'A2     KHOUDEYI      ', value: 'A2' },
  { label: 'A3     VANESSA       ', value: 'A3' },
  { label: 'A4     CANDICE       ', value: 'A4' },
  { label: 'A5     MAËVA         ', value: 'A5' },
  { label: 'B1     SAMIR         ', value: 'B1' },
  { label: 'B2     CHRISTIAN    ', value: 'B2' },
  { label: 'B3     DELAIR        ', value: 'B3' },
  { label: 'B4     ROMAIN        ', value: 'B4' },
  { label: 'B5     BASTIEN       ', value: 'B5' },
  { label: 'B6     BASTIEN       ', value: 'B6' },
  { label: 'B7     RUDY          ', value: 'B7' },
  { label: 'B8     RUDY          ', value: 'B8' },
];

interface DropdownBedroomProps {
  bedroomSelectedParent: (value: string) => void;
}

const DropdownBedroom = ({ bedroomSelectedParent }: DropdownBedroomProps) => {
  const [value, setValue] = useState<string | null>(null);
  const [isFocus, setIsFocus] = useState(false);

  return (
    <View style={styles.container}>
      <Dropdown
        style={[styles.dropdown, isFocus && { borderColor: colors.focus }]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={data}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? 'Quelle chambre ?' : '...'}
        searchPlaceholder="Search..."
        value={value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={(item) => {
          setValue(item.value);
          setIsFocus(false);
          bedroomSelectedParent(item.value);
        }}
        renderLeftIcon={() => (
          <AntDesign
            style={styles.icon}
            color={isFocus ? colors.focus : colors.ink}
            name="safety"
            size={20}
          />
        )}
      />
    </View>
  );
};

export default DropdownBedroom;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: 10,
  },
  dropdown: {
    height: 50,
    borderColor: colors.inputBorder,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});
