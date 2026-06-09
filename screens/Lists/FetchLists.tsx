import React, { useEffect, useState } from 'react';
import { ListItem, Avatar } from '@rneui/themed';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import { useAppDispatch } from '../../store/hooks';
import { GOOGLE_API_KEY } from '../../config/api';
import { show } from '../../store/overlaySlice';
import DropdownBedroom from '../../Components/DropdownBedroom';
import DropdownAnimDirection from '../../Components/DropdownAnimDirection';
import BirthdayOverlay from '../../Components/BirthdayOverlay';
import type {
  ChildListItem,
  FetchListsGroupFilter,
  GoogleSheetsValuesResponse,
} from '../../types/sheets';

interface FetchListsProps {
  group: FetchListsGroupFilter;
}

function FetchLists({ group }: FetchListsProps) {
  const dispatch = useAppDispatch();
  const [list, setList] = useState<ChildListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [animChoice, setAnimChoice] = useState<string | null>(null);
  const [bedroomChoice, setBedroomChoice] = useState<string | null>(null);

  const animSelected = (anim: string | null) => {
    setAnimChoice(anim);
  };

  const bedroomSelected = (bedroom: string | null) => {
    setBedroomChoice(bedroom);
  };

  useEffect(() => {
    async function getLists() {
      const brutResponse = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1cYZK3VclzmylKfc_ArRNF2N__wqmJ9oCJVaMPHIcMzE/values/listeAdaptée!B4:L105?dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response = (await brutResponse.json()) as GoogleSheetsValuesResponse;
      const rows = response.values ?? [];

      const temp: ChildListItem[] = [];

      for (let i = 0; i < rows.length; i++) {
        let grpeAvatar;
        if (rows[i][6] === 'CRABES') {
          grpeAvatar = require('../../assets/LogosGroupes/Crabe.jpg');
        } else if (rows[i][6] === 'REQUINS') {
          grpeAvatar = require('../../assets/LogosGroupes/Requin.jpg');
        } else if (rows[i][6] === 'POULPES') {
          grpeAvatar = require('../../assets/LogosGroupes/Poulpe.jpg');
        }

        let cake;
        if (rows[i][8] === 'OUI') {
          cake = require('../../assets/Gâteau.png');
        }

        temp.push({
          lastName: rows[i][0],
          firstName: rows[i][1],
          sex: rows[i][2],
          birthDate: rows[i][3],
          age: rows[i][4],
          class: rows[i][5],
          group: rows[i][6],
          imageSrc: grpeAvatar,
          room: rows[i][7],
          birthday: cake,
          groupAnim: rows[i][9],
          bedroomAnim: rows[i][10],
        });
      }
      setLoading(false);
      setList(temp);
    }

    getLists();
  }, []);

  let filter: ChildListItem[];

  if (group === 'General') {
    filter = list;
  } else if (group === 'animators') {
    filter = list.filter((child) => child.groupAnim === animChoice);
  } else if (group === 'bedrooms') {
    filter = list.filter((child) => child.room === bedroomChoice);
  } else {
    filter = list.filter((child) => child.group === group);
  }

  const filteredList = (filter ?? []).map((e, i) => (
    <ListItem key={i} bottomDivider>
      <Avatar source={e.imageSrc} />
      <Text style={styles.room}>{e.room}</Text>
      <ListItem.Content>
        <ListItem.Title>{e.lastName}</ListItem.Title>
        <ListItem.Subtitle>{e.firstName}</ListItem.Subtitle>
      </ListItem.Content>
      <Avatar
        key={i}
        source={e.birthday}
        onPress={() => {
          dispatch(show(e.birthDate));
        }}
      />
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
      <BirthdayOverlay />
      {group === 'bedrooms' && <DropdownBedroom bedroomSelectedParent={bedroomSelected} />}
      {group === 'animators' && <DropdownAnimDirection animSelectedParent={animSelected} />}
      <ScrollView>{filteredList}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  room: {
    fontWeight: '400',
    fontSize: 20,
    color: '#121851',
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

export default FetchLists;
