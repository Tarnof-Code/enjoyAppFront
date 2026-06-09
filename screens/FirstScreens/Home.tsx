import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, type ImageSourcePropType } from 'react-native';

import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';
import { Roboto_400Regular } from '@expo-google-fonts/roboto';

import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

import { useAppSelector } from '../../store/hooks';
import { GOOGLE_API_KEY } from '../../config/api';
import type { GoogleSheetsValuesResponse } from '../../types/sheets';

interface HomeInfoItem {
  msg: string;
}

function Home() {
  const animName = useAppSelector((state) => state.animName);
  const [imageSource, setImageSource] = useState<ImageSourcePropType>(
    require('../../assets/PhotosAnims/inconnu.jpg'),
  );
  const [infos, setInfos] = useState<HomeInfoItem[] | false>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getInfos() {
      const brutResponse = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1WFXm3WLSahdpYGJcMmzzsYmLjTY2JA0GQGglr_JFHDs/values/Infos!A1:A20?dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&key=' +
          GOOGLE_API_KEY +
          ' ',
      );
      const response = (await brutResponse.json()) as GoogleSheetsValuesResponse;
      const rows = response.values ?? [];

      const temp: HomeInfoItem[] = [];

      for (let i = 0; i < rows.length; i++) {
        temp.push({
          msg: rows[i][0],
        });
      }

      setInfos(temp);
    }
    getInfos();

    let img: ImageSourcePropType = require('../../assets/PhotosAnims/inconnu.jpg');

    if (animName == 'CANDICE') {
      img = require('../../assets/PhotosAnims/candice.jpg');
    } else if (animName == 'BASTIEN') {
      img = require('../../assets/PhotosAnims/bastien.jpg');
    } else if (animName == 'CHRISTIAN') {
      img = require('../../assets/PhotosAnims/christian.jpeg');
    } else if (animName == 'DERRIEN') {
      img = require('../../assets/PhotosAnims/derrien.jpg');
    } else if (animName == 'EMY') {
      img = require('../../assets/PhotosAnims/emy.jpeg');
    } else if (animName == 'KHOUDEYI') {
      img = require('../../assets/PhotosAnims/khoudeyi.jpeg');
    } else if (animName == 'MAËVA') {
      img = require('../../assets/PhotosAnims/maeva.jpeg');
    } else if (animName == 'NICOLAS') {
      img = require('../../assets/PhotosAnims/nicolas.jpg');
    } else if (animName == 'ROMAIN') {
      img = require('../../assets/PhotosAnims/romain.jpeg');
    } else if (animName == 'RUDY') {
      img = require('../../assets/PhotosAnims/rudy.jpg');
    } else if (animName == 'SAMIR') {
      img = require('../../assets/PhotosAnims/samir.jpg');
    } else if (animName == 'VANESSA') {
      img = require('../../assets/PhotosAnims/vanessa.jpg');
    } else if (animName == 'TARNOF') {
      img = require('../../assets/PhotosAnims/tarnof.jpg');
    }
    setLoading(false);
    setImageSource(img);
  }, [animName]);

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
    Roboto_400Regular,
  });

  const date = new Date();
  const todayDate = dayjs(date).format('dddd DD MMM YYYY');

  let mapInfos;

  if (infos === false) {
    mapInfos = <Text>Loading...</Text>;
  } else {
    mapInfos = infos.map((item, index) => {
      return <Text key={index} style={styles.text}>➤ {item.msg}</Text>;
    });
  }

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.loadingBox}>
        <Text style={styles.loadingText}>Attends... Ça charge !</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleBox}>
        <Text style={styles.title}> Enjoy</Text>
      </View>
      <View style={styles.welcomeBox}>
        <Image source={imageSource} style={styles.image} />
        <Text style={styles.welcomeMsg}>Salut {animName} !</Text>
      </View>
      <Text style={styles.date}>{todayDate}</Text>
      <View style={{ alignItems: 'center', marginTop: 25 }}>
        <View style={styles.reportBox}>
          <ScrollView>{mapInfos}</ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f2f6',
  },
  titleBox: {
    marginLeft: 20,
    marginTop: 50,
  },
  title: {
    fontFamily: 'DancingScript_400Regular',
    fontSize: 40,
    color: '#000000',
  },
  welcomeBox: {
    marginLeft: 30,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 100,
  },
  welcomeMsg: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 20,
    marginLeft: 20,
    color: '#000000',
  },
  date: {
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 18,
    marginTop: 20,
    color: '#000000',
  },
  reportBox: {
    borderWidth: 1,
    borderColor: 'black',
    minHeight: '70%',
    maxHeight: '77%',
    backgroundColor: '#ffffff',
    width: '80%',
    alignItems: 'center',
    padding: 20,
    borderRadius: 40,
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
  text: {
    marginVertical: 6,
    fontSize: 14,
  },
});

export default Home;
