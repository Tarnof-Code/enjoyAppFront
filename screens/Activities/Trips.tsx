import React, { useEffect, useState } from 'react';
import { ListItem, Button, Overlay, Badge } from '@rneui/themed';
import { GOOGLE_API_KEY } from '../../config/api';
import { StyleSheet, Text, View, ScrollView, Linking } from 'react-native';

import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';

import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import DropdownGroup from '../../Components/DropdownGroup';
import CheckList from '../../Components/CheckList';
import type { GoogleSheetsValuesResponse } from '../../types/sheets';
import { colors, fonts } from '../../config/theme';

interface TripItem {
  date: string;
  group: string;
  trip: string;
  departure: string;
  comeBack: string;
  Link: string;
}

export default function FetchTrips() {
  const [tripList, setTripsList] = useState<TripItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupChoice, setGroupChoice] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isVisible2, setIsVisible2] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [tripName, setTripName] = useState<string | null>(null);
  const [departure, setDeparture] = useState<string | null>(null);
  const [comeBack, setComeBack] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
  });

  const groupSelected = (groupSelect: string | null) => {
    setGroupChoice(groupSelect);
  };

  useEffect(() => {
    async function getTrips() {
      const brutResponse1 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Sorties!B1:H6?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response1 = (await brutResponse1.json()) as GoogleSheetsValuesResponse;
      const rows1 = response1.values ?? [];

      const brutResponse2 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Sorties!B8:J13?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response2 = (await brutResponse2.json()) as GoogleSheetsValuesResponse;
      const rows2 = response2.values ?? [];

      const brutResponse3 = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qGo6naquwvwwFm9xJprJojEShx-xm95b6vQkpNrQY1s/values/Sorties!B15:J20?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response3 = (await brutResponse3.json()) as GoogleSheetsValuesResponse;
      const rows3 = response3.values ?? [];

      const temp: TripItem[] = [];

      for (let i = 0; i < rows1.length; i++) {
        temp.push({
          date: dayjs(new Date(rows1[i][0])).format('dddd DD MMM YYYY'),
          group: rows1[i][1],
          trip: rows1[i][2],
          departure: rows1[i][3],
          comeBack: rows1[i][4],
          Link: rows1[i][5],
        });
      }

      for (let j = 0; j < rows2.length; j++) {
        temp.push({
          date: dayjs(new Date(rows2[j][0])).format('dddd DD MMM YYYY'),
          group: rows2[j][1],
          trip: rows2[j][2],
          departure: rows2[j][3],
          comeBack: rows2[j][4],
          Link: rows2[j][5],
        });
      }

      for (let k = 0; k < rows3.length; k++) {
        temp.push({
          date: dayjs(new Date(rows3[k][0])).format('dddd DD MMM YYYY'),
          group: rows3[k][1],
          trip: rows3[k][2],
          departure: rows3[k][3],
          comeBack: rows3[k][4],
          Link: rows3[k][5],
        });
      }

      setLoading(false);
      setTripsList(temp);
    }

    getTrips();
  }, []);

  const filter = tripList.filter((trip) => trip.group === groupChoice);

  const filteredList = (filter ?? []).map((e, i) => (
    <ListItem key={i}>
      <ListItem.Content style={styles.listStyle}>
        <View>
          <ListItem.Title style={styles.dateStyle}>{e.date}</ListItem.Title>
          <ListItem.Title style={styles.titleStyle}>{e.trip}</ListItem.Title>
        </View>
        <Button
          type="solid"
          buttonStyle={styles.button}
          title="Détails"
          titleStyle={{ fontSize: 10 }}
          onPress={() => {
            setIsVisible(true);
            setDate(e.date);
            setTripName(e.trip);
            setDeparture(e.departure);
            setComeBack(e.comeBack);
            setUrl(e.Link);
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
      <Overlay
        overlayStyle={{ flex: 0.2, width: '80%', minHeight: '30%', borderRadius: 50 }}
        isVisible={isVisible}
        onBackdropPress={() => {
          setIsVisible(false);
        }}
      >
        <View style={{ alignItems: 'center', justifyContent: 'flex-start', flex: 1 }}>
          <Text style={styles.titleOver}>{tripName}</Text>
          <Text style={styles.dateOver}>{date}</Text>
          <Text style={styles.infosOver}>Départ : {departure}</Text>
          <Text style={styles.infosOver}>Retour : {comeBack}</Text>
          <Text onPress={() => url && Linking.openURL(url)} style={styles.link}>
            Lien vers le site
          </Text>
        </View>
      </Overlay>

      <Overlay
        overlayStyle={{ flex: 0.2, width: '70%', minHeight: '65%', borderRadius: 50 }}
        isVisible={isVisible2}
        onBackdropPress={() => {
          setIsVisible2(false);
        }}
      >
        <View style={{ alignItems: 'center', justifyContent: 'flex-start', flex: 1 }}>
          <Text style={styles.titleOver}>Check-List</Text>
          <CheckList />
        </View>
      </Overlay>

      <DropdownGroup groupSelectedParent={groupSelected} />

      <Badge
        value="CheckList"
        badgeStyle={styles.badge}
        onPress={() => {
          setIsVisible2(true);
        }}
      />
      <ScrollView>{filteredList}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
  listStyle: {
    backgroundColor: colors.primaryDark,
    borderRadius: 10,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  dateStyle: {
    fontSize: 14,
    color: colors.surface,
    marginLeft: 20,
  },
  titleStyle: {
    fontFamily: fonts.script,
    color: colors.surface,
    marginLeft: 20,
    fontSize: 24,
  },
  titleOver: {
    fontFamily: fonts.script,
    fontSize: 35,
    marginBottom: 20,
  },
  dateOver: {
    fontSize: 15,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  infosOver: {
    margin: 15,
    fontSize: 18,
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.danger,
    width: 65,
    height: 32,
    marginRight: 20,
  },
  link: {
    fontSize: 20,
    color: colors.link,
    marginTop: 30,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  badge: {
    backgroundColor: colors.danger,
    width: 130,
    height: 40,
    marginBottom: 5,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: colors.surface,
  },
});
