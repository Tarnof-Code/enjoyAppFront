import React, { useEffect, useState } from 'react';

import { StyleSheet, Text, ScrollView, View } from 'react-native';
import { ListItem, Avatar } from '@rneui/themed';
import { GOOGLE_API_KEY } from '../../config/api';

import DropdownTreatment from '../../Components/DropdownTreatment';
import type { GoogleSheetsValuesResponse, HealthSheetRow } from '../../types/sheets';
import { colors } from '../../config/theme';

export default function Treatment() {
  const [data, setData] = useState<HealthSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [treatmentChoice, setTreatmentChoice] = useState<string | null>(null);

  const treatmentSelected = (treatmentSelect: string | null) => {
    setTreatmentChoice(treatmentSelect);
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
        let morningMeds = '';
        let middayMeds = '';
        let eveningMeds = '';
        let ifNeededMeds = '';

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
        if (rows[i][3] !== undefined) {
          morningMeds = rows[i][3];
        }
        if (rows[i][4] !== undefined) {
          middayMeds = rows[i][4];
        }
        if (rows[i][5] !== undefined) {
          eveningMeds = rows[i][5];
        }
        if (rows[i][6] !== undefined) {
          ifNeededMeds = rows[i][6];
        }

        temp.push({
          name: rows[i][0],
          group: rows[i][7],
          imageSrc: grpeAvatar,
          general: general,
          morningMeds: morningMeds,
          middayMeds: middayMeds,
          eveningMeds: eveningMeds,
          ifNeededMeds: ifNeededMeds,
        });
      }

      setLoading(false);
      setData(temp);
    }
    fetchData();
  }, []);

  let filter: HealthSheetRow[];
  let filteredData: React.ReactNode;

  if (treatmentChoice === null || treatmentChoice.toLowerCase() === 'quotidiens') {
    filter =
      treatmentChoice === null
        ? data
        : data.filter(
            (child) =>
              child.morningMeds !== '' || child.middayMeds !== '' || child.eveningMeds !== '',
          );
    filteredData = filter.map((e, i) => (
      <ListItem key={i} bottomDivider>
        <Avatar source={e.imageSrc} />
        <ListItem.Content>
          <ListItem.Title style={styles.name}>{e.name}</ListItem.Title>
          {e.morningMeds !== '' ? <Text style={styles.morning}>Matin : {e.morningMeds}</Text> : null}
          {e.middayMeds !== '' ? <Text style={styles.midday}>Midi : {e.middayMeds}</Text> : null}
          {e.eveningMeds !== '' ? <Text style={styles.evening}>Soir : {e.eveningMeds}</Text> : null}
        </ListItem.Content>
      </ListItem>
    ));
  } else if (treatmentChoice.toLowerCase() === 'si besoin') {
    filter = data.filter((child) => child.ifNeededMeds !== '');
    filteredData = filter.map((e, i) => (
      <ListItem key={i} bottomDivider>
        <Avatar source={e.imageSrc} />
        <ListItem.Content>
          <ListItem.Title style={styles.name}>{e.name}</ListItem.Title>
          {e.ifNeededMeds !== '' ? <Text style={styles.morning}>{e.ifNeededMeds}</Text> : null}
        </ListItem.Content>
      </ListItem>
    ));
  }

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <Text style={styles.loadingText}>Attends... Ça charge !</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DropdownTreatment treatmentSelectedParent={treatmentSelected} />
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
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  morning: {
    color: colors.info,
    marginVertical: 4,
  },
  midday: {
    color: colors.success,
    marginVertical: 4,
  },
  evening: {
    color: colors.accent,
    marginVertical: 4,
  },
});
