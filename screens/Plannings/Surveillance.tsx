import React, { useEffect, useState } from 'react';
import { ListItem } from '@rneui/themed';
import { GOOGLE_API_KEY } from '../../config/api';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import DropdownDates from '../../Components/DropdownDates';
import type { GoogleSheetsValuesResponse } from '../../types/sheets';

interface SurveillanceRow {
  date: string;
  batA: string;
  etageBatB: string;
  rdcBatB: string;
}

export default function Surveillance() {
  const [surveillanceList, setSurveillanceList] = useState<SurveillanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateChoice, setDateChoice] = useState<string | null>(null);

  const dateSelected = (dateSelect: string | null) => {
    setDateChoice(dateSelect);
  };

  useEffect(() => {
    async function getSurveillance() {
      const brutResponse = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1n9d2byYOIK2RsqgugZcD9l5WSd3zuAa3CIKOfVvlCHU/values/Surveillance!B1:S4?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response = (await brutResponse.json()) as GoogleSheetsValuesResponse;
      const rows = response.values ?? [];

      const temp: SurveillanceRow[] = [];

      for (let i = 0; i < rows.length; i++) {
        temp.push({
          date: rows[i][0],
          batA: rows[i][1],
          etageBatB: rows[i][2],
          rdcBatB: rows[i][3],
        });
      }

      setLoading(false);
      setSurveillanceList(temp);
    }

    getSurveillance();
  }, []);

  let filter: SurveillanceRow[];

  if (dateChoice === null) {
    let date = new Date();
    if (date < new Date('2022-07-11') || date > new Date('2022-07-29')) {
      date = new Date('2022-07-11');
    }
    const todayDate = dayjs(date).format('DD/MM/YYYY');

    filter = surveillanceList.filter((anim) => anim.date === todayDate);
  } else {
    filter = surveillanceList.filter((anim) => anim.date === dateChoice);
  }

  const filteredList = (filter ?? []).map((e, i) => (
    <ListItem key={i} bottomDivider>
      <ListItem.Content style={{ alignItems: 'center', marginBottom: 20 }}>
        <LinearGradient colors={['#f7f1e3', '#dff9fb']} style={styles.card}>
          <ListItem.Title style={styles.title}>Bâtiment A</ListItem.Title>
          <ListItem.Subtitle style={styles.subTitle}>{e.batA}</ListItem.Subtitle>
          <ListItem.Title style={styles.title}>Bâtiment B / Rdc</ListItem.Title>
          <ListItem.Subtitle style={styles.subTitle}>{e.rdcBatB}</ListItem.Subtitle>
          <ListItem.Title style={styles.title}>Bâtiment B / Etage</ListItem.Title>
          <ListItem.Subtitle style={styles.subTitle}>{e.etageBatB}</ListItem.Subtitle>
        </LinearGradient>
        <ListItem.Title style={{ marginBottom: 200 }}></ListItem.Title>
      </ListItem.Content>
    </ListItem>
  ));

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <Text style={styles.loadingText}>Attends... Ça charge !</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DropdownDates dateSelectedParent={dateSelected} />
      <View>{filteredList}</View>
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
    fontSize: 20,
    marginTop: 30,
  },
  subTitle: {
    fontSize: 20,
  },
  card: {
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    height: '65%',
    paddingTop: 30,
    marginTop: 40,
  },
});
