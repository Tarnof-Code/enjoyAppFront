import React, { useEffect, useState } from 'react';
import { ListItem } from '@rneui/themed';
import { GOOGLE_API_KEY } from '../../config/api';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';

import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import DropdownDates from '../../Components/DropdownDates';
import type { GoogleSheetsValuesResponse } from '../../types/sheets';

interface WakeUpRow {
  date: string;
  couloirA: string;
  etageCouloirB: string;
  rdcCouloirB: string;
  salleReveilA: string;
  salleReveilB: string;
}

export default function Surveillance() {
  const [wakeUpList, setWakeUpList] = useState<WakeUpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateChoice, setDateChoice] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
  });

  const dateSelected = (dateSelect: string | null) => {
    setDateChoice(dateSelect);
  };

  useEffect(() => {
    async function getWakeUp() {
      const brutResponse = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1n9d2byYOIK2RsqgugZcD9l5WSd3zuAa3CIKOfVvlCHU/values/Levers!B1:R6?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response = (await brutResponse.json()) as GoogleSheetsValuesResponse;
      const rows = response.values ?? [];

      const temp: WakeUpRow[] = [];

      for (let i = 0; i < rows.length; i++) {
        temp.push({
          date: rows[i][0],
          couloirA: rows[i][1],
          etageCouloirB: rows[i][2],
          rdcCouloirB: rows[i][3],
          salleReveilA: rows[i][4],
          salleReveilB: rows[i][5],
        });
      }

      setLoading(false);
      setWakeUpList(temp);
    }

    getWakeUp();
  }, []);

  let filter: WakeUpRow[];

  if (dateChoice === null) {
    let date = new Date();
    if (date < new Date('2022-07-12') || date > new Date('2022-07-29')) {
      date = new Date('2022-07-12');
    }
    const todayDate = dayjs(date).format('DD/MM/YYYY');

    filter = wakeUpList.filter((anim) => anim.date === todayDate);
  } else {
    filter = wakeUpList.filter((anim) => anim.date === dateChoice);
  }

  const filteredList = (filter ?? []).map((e, i) => (
    <ListItem key={i} bottomDivider>
      <ListItem.Content style={{ alignItems: 'center', marginBottom: 20 }}>
        <LinearGradient colors={['#f7f1e3', '#dff9fb']} style={styles.card}>
          <ListItem.Title style={styles.hour}>8H15</ListItem.Title>
          <ListItem.Title style={styles.title}>Couloir A</ListItem.Title>
          <ListItem.Subtitle style={styles.subTitle}>{e.couloirA}</ListItem.Subtitle>
          <ListItem.Title style={styles.title}>Couloir B / Rdc</ListItem.Title>
          <ListItem.Subtitle style={styles.subTitle}>{e.rdcCouloirB}</ListItem.Subtitle>
          <ListItem.Title style={styles.title}>Couloir B / Etage</ListItem.Title>
          <ListItem.Subtitle style={styles.subTitle}>{e.etageCouloirB}</ListItem.Subtitle>
        </LinearGradient>

        <LinearGradient colors={['#f7f1e3', '#ffcccc']} style={styles.card}>
          <ListItem.Title style={styles.hour}>8H30</ListItem.Title>
          <ListItem.Title style={styles.title}>Salle de réveil A</ListItem.Title>
          <ListItem.Subtitle style={styles.subTitle}>{e.salleReveilA}</ListItem.Subtitle>
          <ListItem.Title style={styles.title}>Salle de réveil B</ListItem.Title>
          <ListItem.Subtitle style={styles.subTitle}>{e.salleReveilB}</ListItem.Subtitle>
        </LinearGradient>
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
      <DropdownDates dateSelectedParent={dateSelected} />
      <ScrollView>{filteredList}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontStyle: 'italic',
    fontSize: 20,
    fontWeight: '400',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 100,
  },
  title: {
    color: 'blue',
    fontSize: 18,
    marginTop: 10,
  },
  subTitle: {
    fontSize: 18,
  },
  hour: {
    color: 'red',
    fontSize: 25,
    fontFamily: 'DancingScript_400Regular',
  },
  card: {
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    paddingTop: 5,
    paddingBottom: 12,
    marginBottom: 12,
  },
});
