import React, { useEffect, useState } from 'react';
import { ListItem, Avatar } from '@rneui/themed';
import { GOOGLE_API_KEY } from '../../config/api';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import DropdownDates from '../../Components/DropdownDates';
import type { ImageSourcePropType } from 'react-native';
import type { GoogleSheetsValuesResponse } from '../../types/sheets';

interface EveningActivityRow {
  date: string;
  group: string;
  veillee: string;
  photo: ImageSourcePropType;
}

export default function EveningActivities() {
  const [eveningList, setEveningList] = useState<EveningActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateChoice, setDateChoice] = useState<string | null>(null);

  const dateSelected = (dateSelect: string | null) => {
    setDateChoice(dateSelect);
  };

  useEffect(() => {
    async function getEvening() {
      const brutResponse1 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Veillées!B1:T4?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response1 = (await brutResponse1.json()) as GoogleSheetsValuesResponse;
      const rows1 = response1.values ?? [];

      const brutResponse2 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Veillées!B5:T8?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response2 = (await brutResponse2.json()) as GoogleSheetsValuesResponse;
      const rows2 = response2.values ?? [];

      const brutResponse3 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Veillées!B9:T12?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response3 = (await brutResponse3.json()) as GoogleSheetsValuesResponse;
      const rows3 = response3.values ?? [];

      const temp: EveningActivityRow[] = [];

      for (let i = 0; i < rows1.length; i++) {
        temp.push({
          date: rows1[i][0],
          group: rows1[i][1],
          veillee: rows1[i][2],
          photo: require('../../assets/LogosGroupes/Crabe.jpg'),
        });
      }

      for (let j = 0; j < rows2.length; j++) {
        temp.push({
          date: rows2[j][0],
          group: rows2[j][1],
          veillee: rows2[j][2],
          photo: require('../../assets/LogosGroupes/Requin.jpg'),
        });
      }

      for (let k = 0; k < rows3.length; k++) {
        temp.push({
          date: rows3[k][0],
          group: rows3[k][1],
          veillee: rows3[k][2],
          photo: require('../../assets/LogosGroupes/Poulpe.jpg'),
        });
      }

      setLoading(false);
      setEveningList(temp);
    }

    getEvening();
  }, []);

  let filter: EveningActivityRow[];

  if (dateChoice === null) {
    let date = new Date();
    if (date < new Date('2022-07-11') || date > new Date('2022-07-29')) {
      date = new Date('2022-07-11');
    }
    const todayDate = dayjs(date).format('DD/MM/YYYY');

    filter = eveningList.filter((veillee) => veillee.date === todayDate);
  } else {
    filter = eveningList.filter((veillee) => veillee.date === dateChoice);
  }

  const filteredList = (filter ?? []).map((e, i) => (
    <ListItem key={i} style={{ marginTop: 20 }}>
      <Avatar rounded avatarStyle={styles.avatar} source={e.photo} />
      <ListItem.Content>
        <ListItem.Title style={{ color: 'blue' }}>{e.veillee}</ListItem.Title>
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
      <ScrollView>{filteredList}</ScrollView>
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 100,
  },
});
