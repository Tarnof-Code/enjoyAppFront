import React, { useEffect, useState } from 'react';
import { ListItem, Avatar } from '@rneui/themed';
import { GOOGLE_API_KEY } from '../../config/api';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import DropdownAllGroup from '../../Components/DropdownAllGroup';
import DropdownDates from '../../Components/DropdownDates';
import type { DaytimeActivity, GoogleSheetsValuesResponse } from '../../types/sheets';

export default function DaytimeActivities() {
  const [actiList, setActiList] = useState<DaytimeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [animGroupChoice, setAnimGroupChoice] = useState<string | null>(null);
  const [dateChoice, setDateChoice] = useState<string | null>(null);

  const animOrGroupSelected = (animGroupSelect: string | null) => {
    setAnimGroupChoice(animGroupSelect);
  };

  const dateSelected = (dateSelect: string | null) => {
    setDateChoice(dateSelect);
  };

  useEffect(() => {
    async function getActivities() {
      const brutResponse1 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B1:T6?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response1 = (await brutResponse1.json()) as GoogleSheetsValuesResponse;
      const rows1 = response1.values ?? [];

      const brutResponse2 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B7:T12?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response2 = (await brutResponse2.json()) as GoogleSheetsValuesResponse;
      const rows2 = response2.values ?? [];

      const brutResponse3 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B13:T18?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response3 = (await brutResponse3.json()) as GoogleSheetsValuesResponse;
      const rows3 = response3.values ?? [];

      const brutResponse4 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B19:T24?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response4 = (await brutResponse4.json()) as GoogleSheetsValuesResponse;
      const rows4 = response4.values ?? [];

      const brutResponse5 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B25:T30?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response5 = (await brutResponse5.json()) as GoogleSheetsValuesResponse;
      const rows5 = response5.values ?? [];

      const brutResponse6 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B31:T36?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response6 = (await brutResponse6.json()) as GoogleSheetsValuesResponse;
      const rows6 = response6.values ?? [];

      const brutResponse7 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B37:T42?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response7 = (await brutResponse7.json()) as GoogleSheetsValuesResponse;
      const rows7 = response7.values ?? [];

      const brutResponse8 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B43:T48?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response8 = (await brutResponse8.json()) as GoogleSheetsValuesResponse;
      const rows8 = response8.values ?? [];

      const brutResponse9 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B49:T54?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response9 = (await brutResponse9.json()) as GoogleSheetsValuesResponse;
      const rows9 = response9.values ?? [];

      const brutResponse10 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B55:T60?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response10 = (await brutResponse10.json()) as GoogleSheetsValuesResponse;
      const rows10 = response10.values ?? [];

      const brutResponse11 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B61:T66?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response11 = (await brutResponse11.json()) as GoogleSheetsValuesResponse;
      const rows11 = response11.values ?? [];

      const brutResponse12 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B67:T72?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response12 = (await brutResponse12.json()) as GoogleSheetsValuesResponse;
      const rows12 = response12.values ?? [];

      const brutResponse13 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Par anim!B73:T78?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response13 = (await brutResponse13.json()) as GoogleSheetsValuesResponse;
      const rows13 = response13.values ?? [];

      const temp: DaytimeActivity[] = [];

      for (let i = 0; i < rows1.length; i++) {
        temp.push({
          date: rows1[i][0],
          group: rows1[i][1],
          anim: rows1[i][2],
          morning: rows1[i][3],
          afternoon: rows1[i][4],
          photo: require('../../assets/PhotosAnims/romain.jpeg'),
        });
      }

      for (let j = 0; j < rows2.length; j++) {
        temp.push({
          date: rows2[j][0],
          group: rows2[j][1],
          anim: rows2[j][2],
          morning: rows2[j][3],
          afternoon: rows2[j][4],
          photo: require('../../assets/PhotosAnims/khoudeyi.jpeg'),
        });
      }

      for (let k = 0; k < rows3.length; k++) {
        temp.push({
          date: rows3[k][0],
          group: rows3[k][1],
          anim: rows3[k][2],
          morning: rows3[k][3],
          afternoon: rows3[k][4],
          photo: require('../../assets/PhotosAnims/nicolas.jpg'),
        });
      }

      for (let l = 0; l < rows4.length; l++) {
        temp.push({
          date: rows4[l][0],
          group: rows4[l][1],
          anim: rows4[l][2],
          morning: rows4[l][3],
          afternoon: rows4[l][4],
          photo: require('../../assets/PhotosAnims/emy.jpeg'),
        });
      }

      for (let m = 0; m < rows5.length; m++) {
        temp.push({
          date: rows5[m][0],
          group: rows5[m][1],
          anim: rows5[m][2],
          morning: rows5[m][3],
          afternoon: rows5[m][4],
          photo: require('../../assets/PhotosAnims/samir.jpg'),
        });
      }

      for (let n = 0; n < rows6.length; n++) {
        temp.push({
          date: rows6[n][0],
          group: rows6[n][1],
          anim: rows6[n][2],
          morning: rows6[n][3],
          afternoon: rows6[n][4],
          photo: require('../../assets/PhotosAnims/christian.jpeg'),
        });
      }

      for (let o = 0; o < rows7.length; o++) {
        temp.push({
          date: rows7[o][0],
          group: rows7[o][1],
          anim: rows7[o][2],
          morning: rows7[o][3],
          afternoon: rows7[o][4],
          photo: require('../../assets/PhotosAnims/maeva.jpeg'),
        });
      }

      for (let p = 0; p < rows8.length; p++) {
        temp.push({
          date: rows8[p][0],
          group: rows8[p][1],
          anim: rows8[p][2],
          morning: rows8[p][3],
          afternoon: rows8[p][4],
          photo: require('../../assets/PhotosAnims/candice.jpg'),
        });
      }

      for (let q = 0; q < rows9.length; q++) {
        temp.push({
          date: rows9[q][0],
          group: rows9[q][1],
          anim: rows9[q][2],
          morning: rows9[q][3],
          afternoon: rows9[q][4],
          photo: require('../../assets/PhotosAnims/direction1.jpg'),
        });
      }

      for (let r = 0; r < rows10.length; r++) {
        temp.push({
          date: rows10[r][0],
          group: rows10[r][1],
          anim: rows10[r][2],
          morning: rows10[r][3],
          afternoon: rows10[r][4],
          photo: require('../../assets/PhotosAnims/rudy.jpg'),
        });
      }

      for (let s = 0; s < rows11.length; s++) {
        temp.push({
          date: rows11[s][0],
          group: rows11[s][1],
          anim: rows11[s][2],
          morning: rows11[s][3],
          afternoon: rows11[s][4],
          photo: require('../../assets/PhotosAnims/direction2.png'),
        });
      }

      for (let t = 0; t < rows12.length; t++) {
        temp.push({
          date: rows12[t][0],
          group: rows12[t][1],
          anim: rows12[t][2],
          morning: rows12[t][3],
          afternoon: rows12[t][4],
          photo: require('../../assets/PhotosAnims/bastien.jpg'),
        });
      }

      for (let u = 0; u < rows13.length; u++) {
        temp.push({
          date: rows13[u][0],
          group: rows13[u][1],
          anim: rows13[u][2],
          morning: rows13[u][3],
          afternoon: rows13[u][4],
          photo: require('../../assets/PhotosAnims/vanessa.jpg'),
        });
      }
      setLoading(false);
      setActiList(temp);
    }

    getActivities();
  }, []);

  let filter: DaytimeActivity[];

  if ((animGroupChoice === null || animGroupChoice.toLowerCase() === 'tous') && dateChoice === null) {
    let date = new Date();
    if (date < new Date('2022-07-11') || date > new Date('2022-07-29')) {
      date = new Date('2022-07-11');
    }
    const todayDate = dayjs(date).format('DD/MM/YYYY');
    filter = actiList.filter((acti) => acti.date === todayDate);
  } else if (
    (animGroupChoice === null || animGroupChoice.toLowerCase() === 'tous') &&
    dateChoice !== null
  ) {
    filter = actiList.filter((acti) => acti.date === dateChoice);
  } else if (dateChoice === null && animGroupChoice !== null) {
    let date = new Date();
    if (date < new Date('2022-07-11') || date > new Date('2022-07-29')) {
      date = new Date('2022-07-11');
    }
    const todayDate = dayjs(date).format('DD/MM/YYYY');
    filter = actiList.filter(
      (acti) =>
        acti.date === todayDate && acti.group.toLowerCase() === animGroupChoice.toLowerCase(),
    );
  } else {
    filter = actiList.filter(
      (acti) =>
        acti.date === dateChoice && acti.group.toLowerCase() === animGroupChoice!.toLowerCase(),
    );
  }

  const filteredList = (filter ?? []).map((e, i) => (
    <ListItem key={i} bottomDivider>
      <Avatar rounded avatarStyle={styles.avatar} source={e.photo} />
      <ListItem.Content>
        <ListItem.Title style={{ color: 'blue' }}>Matin: {e.morning}</ListItem.Title>
        <ListItem.Title style={{ color: 'green' }}>Aprem: {e.afternoon}</ListItem.Title>
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
      <DropdownAllGroup animOrGroupSelectedParent={animOrGroupSelected} />
      <ScrollView>{filteredList}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  },
});
