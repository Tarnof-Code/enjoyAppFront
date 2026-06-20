import React, { useEffect, useState } from 'react';

import { StyleSheet, Text, View, Linking, Platform, ScrollView } from 'react-native';
import { ListItem, Button } from '@rneui/themed';
import { GOOGLE_API_KEY } from '../../config/api';

import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';

import DropdownNumbers from '../../Components/DropdownNumbers';
import type { GoogleSheetsValuesResponse, UsefulNumber } from '../../types/sheets';
import { colors } from '../../config/theme';

export default function UsefulNumbers() {
  const [data, setData] = useState<UsefulNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [numberChoice, setNumberChoice] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
  });

  const numberSelected = (numberSelect: string | null) => {
    setNumberChoice(numberSelect);
  };

  function makeCall(phone: string) {
    if (Platform.OS === 'android') {
      Linking.openURL(`tel:${phone}`);
    } else {
      Linking.openURL(`telprompt:${phone}`);
    }
  }

  useEffect(() => {
    async function getData() {
      const brutResponse = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1Jl7F-H5zvTaGEQ-5-xDzm8Ve-ASdct1QD39F56W9d3Q/values/numbers!A1:D40?dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          '',
      );
      const response = (await brutResponse.json()) as GoogleSheetsValuesResponse;
      const rows = response.values ?? [];

      const temp: UsefulNumber[] = [];
      for (let i = 0; i < rows.length; i++) {
        temp.push({
          label: rows[i][0],
          name: rows[i][1],
          number: rows[i][2],
          comment: rows[i][3],
        });
      }

      setLoading(false);
      setData(temp);
    }
    getData();
  }, []);

  let choice: UsefulNumber[];

  if (numberChoice === 'Equipe' || numberChoice === null) {
    choice = data.filter((e) => e.label === 'Equipe');
  } else if (numberChoice === 'Administration') {
    choice = data.filter((e) => e.label === 'Administration');
  } else if (numberChoice === 'Activités') {
    choice = data.filter((e) => e.label === 'Activités');
  } else {
    choice = [];
  }

  const filteredNumbers = (choice ?? []).map((e, i) => (
    <ListItem key={i} bottomDivider>
      <ListItem.Content style={styles.listStyle}>
        <View>
          <ListItem.Title style={{ color: colors.info }}>{e.name}</ListItem.Title>
          <ListItem.Title style={{ color: colors.success }}>{e.number}</ListItem.Title>
        </View>
        <Button
          type="solid"
          buttonStyle={styles.button}
          title="Appeler"
          titleStyle={{ fontSize: 10 }}
          onPress={() => {
            makeCall(e.number);
          }}
        />
      </ListItem.Content>
    </ListItem>
  ));

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.loadingBox}>
        <Text style={styles.loadingText}>Attends... Ça charge !</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DropdownNumbers numberSelectedParent={numberSelected} />
      <ScrollView>{filteredNumbers}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listStyle: {
    borderRadius: 10,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.danger,
    width: 65,
    height: 32,
    marginRight: 20,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontStyle: 'italic',
    fontSize: 20,
    fontWeight: '400',
  },
});
