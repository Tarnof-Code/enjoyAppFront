import React, { useEffect, useState } from 'react';
import { ListItem, Avatar } from '@rneui/themed';
import { GOOGLE_API_KEY } from '../../config/api';
import { StyleSheet, Text, View, ScrollView, type ImageSourcePropType } from 'react-native';

import type { GoogleSheetsValuesResponse } from '../../types/sheets';
import { colors } from '../../config/theme';

interface HolidayItem {
  anim: string;
  firstDay: string;
  secondDay: string;
  imageSrc?: ImageSourcePropType;
}

export default function Holidays() {
  const [list, setList] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getHolidays() {
      const brutResponse = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1n9d2byYOIK2RsqgugZcD9l5WSd3zuAa3CIKOfVvlCHU/values/Congés!A1:M3?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response = (await brutResponse.json()) as GoogleSheetsValuesResponse;
      const rows = response.values ?? [];

      const temp: HolidayItem[] = [];

      for (let i = 0; i < rows.length; i++) {
        let image: ImageSourcePropType | undefined;

        if (rows[i][0].toLowerCase() === 'romain') {
          image = require('../../assets/PhotosAnims/romain.jpeg');
        } else if (rows[i][0].toLowerCase() === 'emy') {
          image = require('../../assets/PhotosAnims/emy.jpeg');
        } else if (rows[i][0].toLowerCase() === 'maeva') {
          image = require('../../assets/PhotosAnims/maeva.jpeg');
        } else if (rows[i][0].toLowerCase() === 'khoudeyi') {
          image = require('../../assets/PhotosAnims/khoudeyi.jpeg');
        } else if (rows[i][0].toLowerCase() === 'christian') {
          image = require('../../assets/PhotosAnims/christian.jpeg');
        } else if (rows[i][0].toLowerCase() === 'candice') {
          image = require('../../assets/PhotosAnims/candice.jpg');
        } else if (rows[i][0].toLowerCase() === 'bastien') {
          image = require('../../assets/PhotosAnims/bastien.jpg');
        } else if (rows[i][0].toLowerCase() === 'nicolas') {
          image = require('../../assets/PhotosAnims/nicolas.jpg');
        } else if (rows[i][0].toLowerCase() === 'samir') {
          image = require('../../assets/PhotosAnims/samir.jpg');
        } else if (rows[i][0].toLowerCase() === 'rudy') {
          image = require('../../assets/PhotosAnims/rudy.jpg');
        } else if (rows[i][0].toLowerCase() === 'vanessa') {
          image = require('../../assets/PhotosAnims/vanessa.jpg');
        } else if (rows[i][0].toLowerCase() === 'derrien') {
          image = require('../../assets/PhotosAnims/derrien.jpg');
        } else if (rows[i][0].toLowerCase() === 'tarnof') {
          image = require('../../assets/PhotosAnims/tarnof.jpg');
        }

        temp.push({
          anim: rows[i][0],
          firstDay: rows[i][1],
          secondDay: rows[i][2],
          imageSrc: image,
        });
      }
      setLoading(false);
      setList(temp);
    }

    getHolidays();
  }, []);

  const filteredList = list.map((e, i) => (
    <ListItem key={i}>
      <Avatar rounded source={e.imageSrc} size="medium" />
      <ListItem.Content>
        <ListItem.Title style={{ color: colors.info }}>{e.firstDay}</ListItem.Title>
        <ListItem.Title style={{ color: colors.success }}>{e.secondDay}</ListItem.Title>
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
      <ScrollView>{filteredList}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  room: {
    fontWeight: '400',
    fontSize: 20,
    color: colors.primary,
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
});
