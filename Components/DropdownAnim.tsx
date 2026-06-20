import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

import { colors } from '../config/theme';
import { AntDesign } from '@expo/vector-icons';

const data = [
  { label: 'Bastien', value: 'Bastien' },
  { label: 'Candice', value: 'Candice' },
  { label: 'Christian', value: 'Christian' },
  { label: 'Emy', value: 'Emy' },
  { label: 'Khoudeyi', value: 'Khoudeyi' },
  { label: 'Maëva', value: 'Maëva' },
  { label: 'Nicolas', value: 'Nicolas' },
  { label: 'Romain', value: 'Romain' },
  { label: 'Rudy', value: 'Rudy' },
  { label: 'Samir', value: 'Samir' },
  { label: 'Vanessa', value: 'Vanessa' },
];

interface DropdownAnimProps {
  animSelectedParent: (value: string) => void;
}

const DropdownAnim = ({ animSelectedParent }: DropdownAnimProps) => {
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
        placeholder={!isFocus ? 'Quel animateur ?' : '...'}
        searchPlaceholder="Search..."
        value={value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={(item) => {
          setValue(item.value);
          setIsFocus(false);
          animSelectedParent(item.value);
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

export default DropdownAnim;

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
