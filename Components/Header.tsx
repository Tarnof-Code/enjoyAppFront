import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  type ImageSourcePropType,
} from 'react-native';

import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';

import { useAppSelector } from '../store/hooks';
import { colors, fonts } from '../config/theme';

interface HeaderProps {
  iconName: keyof typeof FontAwesome5.glyphMap;
  title: string;
}

function Header({ iconName, title }: HeaderProps) {
  const animName = useAppSelector((state) => state.animName);
  const [imageSource, setImageSource] = useState<ImageSourcePropType>(
    require('../assets/PhotosAnims/inconnu.jpg'),
  );

  useEffect(() => {
    let temp: ImageSourcePropType = require('../assets/PhotosAnims/inconnu.jpg');

    if (animName === 'CANDICE') {
      temp = require('../assets/PhotosAnims/candice.jpg');
    } else if (animName === 'BASTIEN') {
      temp = require('../assets/PhotosAnims/bastien.jpg');
    } else if (animName === 'CHRISTIAN') {
      temp = require('../assets/PhotosAnims/christian.jpeg');
    } else if (animName === 'DERRIEN') {
      temp = require('../assets/PhotosAnims/derrien.jpg');
    } else if (animName === 'EMY') {
      temp = require('../assets/PhotosAnims/emy.jpeg');
    } else if (animName === 'KHOUDEYI') {
      temp = require('../assets/PhotosAnims/khoudeyi.jpeg');
    } else if (animName === 'MAËVA') {
      temp = require('../assets/PhotosAnims/maeva.jpeg');
    } else if (animName === 'NICOLAS') {
      temp = require('../assets/PhotosAnims/nicolas.jpg');
    } else if (animName === 'ROMAIN') {
      temp = require('../assets/PhotosAnims/romain.jpeg');
    } else if (animName === 'RUDY') {
      temp = require('../assets/PhotosAnims/rudy.jpg');
    } else if (animName === 'SAMIR') {
      temp = require('../assets/PhotosAnims/samir.jpg');
    } else if (animName === 'VANESSA') {
      temp = require('../assets/PhotosAnims/vanessa.jpg');
    } else if (animName === 'TARNOF') {
      temp = require('../assets/PhotosAnims/tarnof.jpg');
    }

    setImageSource(temp);
  }, [animName]);

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.alignElements}>
        <View style={styles.iconContainer}>
          <FontAwesome5 style={styles.icon} name={iconName} size={27} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            console.log('clicked');
          }}
        >
          <Image source={imageSource} style={styles.image} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    backgroundColor: colors.surface,
    justifyContent: 'flex-end',
  },
  icon: {
    marginLeft: 15,
    marginBottom: 4,
  },
  alignElements: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 30,
    marginBottom: 9,
    color: colors.primary,
  },
  image: {
    width: 65,
    height: 65,
    borderRadius: 100,
    marginBottom: 7,
  },
  textContainer: {
    width: '60%',
  },
  iconContainer: {
    width: '15%',
  },
});

export default Header;
