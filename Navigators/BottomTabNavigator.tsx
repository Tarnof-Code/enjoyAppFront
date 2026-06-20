import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { lireDernierSejourVisite } from '../helpers/dernierSejour';
import Login from '../screens/FirstScreens/Login';
import Home from '../screens/FirstScreens/Home';
import SejourPicker from '../screens/FirstScreens/SejourPicker';
import { accountService } from '../services/account.service';
import { sejourService } from '../services/sejour.service';
import { setOnSessionExpired } from '../services/httpClient';
import { store } from '../store';
import { setName as setAnimName } from '../store/animNameSlice';
import { clearUser, setBootstrapDone, setUserFromProfil } from '../store/authSlice';
import { clearSejour, setSejourCourant } from '../store/sejourSlice';
import { colors } from '../config/theme';

import TopTabActivities from './TopTabActivities';
import TopTabPlannings from './TopTabPlannings';
import TopTabLists from './TopTabLists';
import TopTabHealth from './TopTabHealth';
import type { BottomTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function BottomTab() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.disabled,
        tabBarIcon: ({ color }) => {
          let iconName: keyof typeof FontAwesome5.glyphMap = 'home';
          if (route.name === 'Listes') {
            iconName = 'list-ul';
          } else if (route.name === 'Plannings') {
            iconName = 'calendar-alt';
          } else if (route.name === 'Activités') {
            iconName = 'dice';
          } else if (route.name === 'Sanitaire') {
            iconName = 'notes-medical';
          } else if (route.name === 'Home') {
            iconName = 'home';
          }
          return <FontAwesome5 name={iconName} size={25} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Listes" component={TopTabLists} />
      <Tab.Screen name="Plannings" component={TopTabPlannings} />
      <Tab.Screen name="Activités" component={TopTabActivities} />
      <Tab.Screen name="Sanitaire" component={TopTabHealth} />
    </Tab.Navigator>
  );
}

export default function BottomTabNavigator() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');

  useEffect(() => {
    setOnSessionExpired(() => {
      store.dispatch(clearUser());
      store.dispatch(clearSejour());
      store.dispatch(setAnimName(''));
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    });

    return () => setOnSessionExpired(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      let route: keyof RootStackParamList = 'Login';

      try {
        const profil = await accountService.restoreSession();
        if (cancelled) return;

        if (profil) {
          store.dispatch(
            setUserFromProfil({
              tokenId: profil.tokenId,
              role: String(profil.role),
              prenom: profil.prenom,
              nom: profil.nom,
              genre: profil.genre,
            }),
          );
          store.dispatch(setAnimName(profil.prenom.trim().toUpperCase()));

          route = 'SejourPicker';
          const dernierId = await lireDernierSejourVisite(profil.tokenId);
          if (dernierId != null) {
            try {
              const sejour = await sejourService.getSejourById(dernierId);
              store.dispatch(setSejourCourant(sejour));
              route = 'BottomTab';
            } catch {
              /* séjour mémorisé inaccessible */
            }
          }
        }
      } finally {
        if (!cancelled) {
          store.dispatch(setBootstrapDone());
          setInitialRoute(route);
          setBootstrapped(true);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!bootstrapped) {
    return (
      <View style={styles.bootstrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SejourPicker" component={SejourPicker} />
        <Stack.Screen name="BottomTab" component={BottomTab} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bootstrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
