import React, { useEffect, useState } from 'react';
import { ListItem, Avatar, Button, Overlay } from '@rneui/themed';
import { GOOGLE_API_KEY } from '../../config/api';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';

import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import DropdownDates from '../../Components/DropdownDates';
import type { GoogleSheetsValuesResponse, MealPlanning } from '../../types/sheets';

interface MenuRow {
  date: string;
  lunch1: string;
  lunch2: string;
  lunch3: string;
  lunch4: string;
  lunch5: string;
  dinner1: string;
  dinner2: string;
  dinner3: string;
  dinner4: string;
  dinner5: string;
}

export default function FetchMeals() {
  const [planningMeals, setPlanningMeals] = useState<MealPlanning[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateChoice, setDateChoice] = useState<string | null>(null);
  const [mealList, setMealList] = useState<MenuRow[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
  });

  const dateSelected = (dateSelect: string | null) => {
    setDateChoice(dateSelect);
  };

  useEffect(() => {
    async function getMeals() {
      const brutResponse = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/19URxY0asBXbZ7NGSESH2anh6Oz5dtz98ITTU2dzm3vY/values/Repas!C1:T10?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response = (await brutResponse.json()) as GoogleSheetsValuesResponse;
      const rows = response.values ?? [];

      const brutMenus = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/13cquIRJ93PDO9YGr6_jwQEOux2Z-B8ZDl4GtrWzuyW8/values/menus_BDD!A1:S12?dateTimeRenderOption=FORMATTED_STRING&majorDimension=COLUMNS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          '',
      );
      const menus = (await brutMenus.json()) as GoogleSheetsValuesResponse;
      const menuRows = menus.values ?? [];

      const temp: MealPlanning[] = [];
      const menuListTemp: MenuRow[] = [];

      for (let i = 0; i < rows.length; i++) {
        temp.push({
          date: rows[i][0],
          group: 'Crabes',
          ptitDej: rows[i][1],
          dej: rows[i][4],
          diner: rows[i][7],
          photo: require('../../assets/LogosGroupes/Crabe.jpg'),
        });
      }

      for (let i = 0; i < rows.length; i++) {
        temp.push({
          date: rows[i][0],
          group: 'Requins',
          ptitDej: rows[i][2],
          dej: rows[i][5],
          diner: rows[i][8],
          photo: require('../../assets/LogosGroupes/Requin.jpg'),
        });
      }

      for (let i = 0; i < rows.length; i++) {
        temp.push({
          date: rows[i][0],
          group: 'Poulpes',
          ptitDej: rows[i][3],
          dej: rows[i][6],
          diner: rows[i][9],
          photo: require('../../assets/LogosGroupes/Poulpe.jpg'),
        });
      }

      for (let i = 0; i < menuRows.length; i++) {
        menuListTemp.push({
          date: menuRows[i][0],
          lunch1: menuRows[i][1],
          lunch2: menuRows[i][2],
          lunch3: menuRows[i][3],
          lunch4: menuRows[i][4],
          lunch5: menuRows[i][5],
          dinner1: menuRows[i][7],
          dinner2: menuRows[i][8],
          dinner3: menuRows[i][9],
          dinner4: menuRows[i][10],
          dinner5: menuRows[i][11],
        });
      }

      setLoading(false);
      setPlanningMeals(temp);
      setMealList(menuListTemp);
    }

    getMeals();
  }, []);

  let filter: MealPlanning[];
  let filterMenu: MenuRow[];

  if (dateChoice === null) {
    let date = new Date();
    if (date < new Date('2022-07-12') || date > new Date('2022-07-29')) {
      date = new Date('2022-07-12');
    }
    const todayDate = dayjs(date).format('DD/MM/YYYY');

    filter = planningMeals.filter((meal) => meal.date === todayDate);
    filterMenu = mealList.filter((meal) => meal.date === todayDate);
  } else {
    filter = planningMeals.filter((meal) => meal.date === dateChoice);
    filterMenu = mealList.filter((meal) => meal.date === dateChoice);
  }

  const breakfast = (filter ?? []).map((e, i) => (
    <ListItem key={i} style={{ marginLeft: 30 }}>
      <Avatar rounded avatarStyle={styles.avatar} source={e.photo} />
      <ListItem.Content>
        <ListItem.Title style={{ color: 'blue' }}>{e.ptitDej}</ListItem.Title>
      </ListItem.Content>
    </ListItem>
  ));

  const lunch = (filter ?? []).map((e, i) => (
    <ListItem key={i} style={{ marginLeft: 30 }}>
      <Avatar rounded avatarStyle={styles.avatar} source={e.photo} />
      <ListItem.Content>
        <ListItem.Title style={{ color: 'blue' }}>{e.dej}</ListItem.Title>
      </ListItem.Content>
    </ListItem>
  ));

  const diner = (filter ?? []).map((e, i) => (
    <ListItem key={i} style={{ marginLeft: 30 }}>
      <Avatar rounded avatarStyle={styles.avatar} source={e.photo} />
      <ListItem.Content>
        <ListItem.Title style={{ color: 'blue' }}>{e.diner}</ListItem.Title>
      </ListItem.Content>
    </ListItem>
  ));

  const lunchMenu = (filterMenu ?? []).map((e, i) => (
    <ListItem key={i}>
      <ListItem.Content>
        <ListItem.Title style={styles.detailsMenu}>{e.lunch1}</ListItem.Title>
        <ListItem.Title style={styles.detailsMenu}>{e.lunch2}</ListItem.Title>
        <ListItem.Title style={styles.detailsMenu}>{e.lunch3}</ListItem.Title>
        <ListItem.Title style={styles.detailsMenu}>{e.lunch4}</ListItem.Title>
        <ListItem.Title style={styles.detailsMenu}>{e.lunch5}</ListItem.Title>
      </ListItem.Content>
    </ListItem>
  ));

  const dinerMenu = (filterMenu ?? []).map((e, i) => (
    <ListItem key={i}>
      <ListItem.Content>
        <ListItem.Title style={styles.detailsMenu}>{e.dinner1}</ListItem.Title>
        <ListItem.Title style={styles.detailsMenu}>{e.dinner2}</ListItem.Title>
        <ListItem.Title style={styles.detailsMenu}>{e.dinner3}</ListItem.Title>
        <ListItem.Title style={styles.detailsMenu}>{e.dinner4}</ListItem.Title>
        <ListItem.Title style={styles.detailsMenu}>{e.dinner5}</ListItem.Title>
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
        overlayStyle={{ flex: 0.3, width: '85%', minHeight: '85%', borderRadius: 50 }}
        isVisible={isVisible}
        onBackdropPress={() => {
          setIsVisible(false);
        }}
      >
        <ScrollView>
          <View style={{ alignItems: 'center', justifyContent: 'flex-start', flex: 1 }}>
            <Text style={styles.titleOver}>Menus</Text>
            <Text style={styles.subTitle}>Déjeûner</Text>
            <View style={styles.menuStyle}>{lunchMenu}</View>
            <Text style={styles.subTitle}>Dîner</Text>
            <View style={styles.menuStyle}>{dinerMenu}</View>
          </View>
        </ScrollView>
        <Button
          title="Retour"
          buttonStyle={styles.button}
          titleStyle={{ fontSize: 13 }}
          onPress={() => {
            setIsVisible(false);
          }}
        />
        <View style={{ marginTop: 10 }}></View>
      </Overlay>
      <DropdownDates dateSelectedParent={dateSelected} />

      <Button
        type="solid"
        buttonStyle={styles.button}
        title="Menus"
        titleStyle={{ fontSize: 13 }}
        onPress={() => {
          setIsVisible(true);
        }}
      />
      <ScrollView>
        <View style={{ marginTop: 20 }}></View>
        <View style={styles.titleBox}>
          <Text style={styles.title}>Ptit Dej</Text>
        </View>
        <View style={styles.mealBox}>{breakfast}</View>
        <View style={styles.titleBox}>
          <Text style={styles.title}>Dej</Text>
        </View>
        <View style={styles.mealBox}>{lunch}</View>
        <View style={styles.titleBox}>
          <Text style={styles.title}>Dîner</Text>
        </View>
        <View style={styles.mealBox}>{diner}</View>
        <View style={{ marginBottom: 80 }}></View>
      </ScrollView>
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
  title: {
    fontFamily: 'DancingScript_400Regular',
    fontSize: 32,
  },
  titleBox: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  mealBox: {
    marginBottom: 20,
  },
  button: {
    borderRadius: 20,
    backgroundColor: '#F94A56',
    width: 100,
    height: 35,
    alignSelf: 'center',
    marginVertical: 5,
    marginTop: 20,
  },
  titleOver: {
    fontFamily: 'DancingScript_400Regular',
    fontSize: 35,
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'blue',
  },
  menuStyle: {
    width: '100%',
  },
  detailsMenu: {
    fontSize: 22,
    fontFamily: 'DancingScript_400Regular',
    alignSelf: 'center',
  },
});
