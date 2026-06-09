import React, { useEffect, useState } from 'react';

import { StyleSheet, Text, ScrollView, View } from 'react-native';
import { ListItem, Avatar } from '@rneui/themed';
import { GOOGLE_API_KEY } from '../../config/api';

import DropdownAllGroup from '../../Components/DropdownAllGroup';
import type { GoogleSheetsValuesResponse, HealthSheetRow } from '../../types/sheets';

export default function GeneralHealth() {
  const [data, setData] = useState<HealthSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [animGroupChoice, setAnimGroupChoice] = useState<string | null>(null);

  const animOrGroupSelected = (animGroupSelect: string | null) => {
    setAnimGroupChoice(animGroupSelect);
  };

  useEffect(() => {
    async function fetchData() {
      const brutResponse = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1wAm55hR8mluDI_9ATL-LMYUzJOtEpym4zmhpk179Pf8/values/Pour BDD!A2:H91?dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          '',
      );
      const response = (await brutResponse.json()) as GoogleSheetsValuesResponse;
      const rows = response.values ?? [];

      const temp: HealthSheetRow[] = [];

      for (let i = 0; i < rows.length; i++) {
        let general = '';

        let grpeAvatar;
        if (rows[i][7] === 'CRABES') {
          grpeAvatar = require('../../assets/LogosGroupes/Crabe.jpg');
        } else if (rows[i][7] === 'REQUINS') {
          grpeAvatar = require('../../assets/LogosGroupes/Requin.jpg');
        } else if (rows[i][7] === 'POULPES') {
          grpeAvatar = require('../../assets/LogosGroupes/Poulpe.jpg');
        }

        if (rows[i][1] !== undefined) {
          general = rows[i][1];
        }

        temp.push({
          name: rows[i][0],
          group: rows[i][7],
          imageSrc: grpeAvatar,
          general: general,
        });
      }

      setLoading(false);
      setData(temp);
    }
    fetchData();
  }, []);

  let filter: HealthSheetRow[] | undefined;

  if (animGroupChoice === null || animGroupChoice.toLowerCase() === 'tous') {
    filter = data.filter((child) => child.general !== '');
  } else if (animGroupChoice !== null && animGroupChoice.toLowerCase() === 'crabes') {
    filter = data.filter((child) => child.group.toLowerCase() === 'crabes' && child.general !== '');
  } else if (animGroupChoice !== null && animGroupChoice.toLowerCase() === 'requins') {
    filter = data.filter((child) => child.group.toLowerCase() === 'requins' && child.general !== '');
  } else if (animGroupChoice !== null && animGroupChoice.toLowerCase() === 'poulpes') {
    filter = data.filter((child) => child.group.toLowerCase() === 'poulpes' && child.general !== '');
  }

  const filteredData = (filter ?? []).map((e, i) => (
    <ListItem key={i} bottomDivider>
      <Avatar source={e.imageSrc} />
      <ListItem.Content>
        <ListItem.Title style={{ color: 'blue' }}>{e.name}</ListItem.Title>
        <ListItem.Title style={{ color: 'green' }}>{e.general}</ListItem.Title>
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
      <DropdownAllGroup animOrGroupSelectedParent={animOrGroupSelected} />
      <ScrollView>{filteredData}</ScrollView>
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
});
