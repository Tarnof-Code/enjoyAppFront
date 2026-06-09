import React, { useEffect, useState } from 'react';
import { ListItem } from '@rneui/themed';
import { GOOGLE_API_KEY } from '../../config/api';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import type { GoogleSheetsValuesResponse } from '../../types/sheets';

interface LaundryBatRow {
  bat: string;
  date1: string;
  date2: string;
  date3: string;
  date4: string;
  date5: string;
  date6: string;
}

export default function Laundry() {
  const [laundryList, setLaundryList] = useState<LaundryBatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getData() {
      const brutResponse = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1yy3cxPQCLHyISPECuLDDNd2pZH9nxNKAJLJTYhtEsOs/values/Lessives_BDD!A1:B7?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response = (await brutResponse.json()) as GoogleSheetsValuesResponse;
      const rows = response.values ?? [];

      const temp: LaundryBatRow[] = [];
      for (let i = 0; i < rows.length; i++) {
        temp.push({
          bat: rows[i][0],
          date1: rows[i][1],
          date2: rows[i][2],
          date3: rows[i][3],
          date4: rows[i][4],
          date5: rows[i][5],
          date6: rows[i][6],
        });
      }

      setLoading(false);
      setLaundryList(temp);
    }

    getData();
  }, []);

  const batA = laundryList.map((e, i) => (
    <ListItem key={i} style={{ marginTop: 10 }}>
      <ListItem.Content>
        <ListItem.Title style={styles.title}>{e.bat}</ListItem.Title>
        <ListItem.Title style={styles.dates}>{e.date1}</ListItem.Title>
        <ListItem.Title style={styles.dates}>{e.date2}</ListItem.Title>
        <ListItem.Title style={styles.dates}>{e.date3}</ListItem.Title>
        <ListItem.Title style={styles.dates}>{e.date4}</ListItem.Title>
        <ListItem.Title style={styles.dates}>{e.date5}</ListItem.Title>
        <ListItem.Title style={styles.dates}>{e.date6}</ListItem.Title>
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
      <ScrollView>{batA}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  title: {
    alignSelf: 'center',
    fontFamily: 'DancingScript_400Regular',
    fontSize: 35,
    marginBottom: 5,
  },
  dates: {
    alignSelf: 'center',
    color: 'blue',
  },
});
