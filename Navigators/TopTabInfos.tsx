import * as React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';

import UsefulNumbers from '../screens/Infos/UsefulNumbers';
import Regulations from '../screens/Infos/Regulations';
import Weather from '../screens/Infos/Weather';
import Header from '../Components/Header';
import type { InfosTabParamList } from './types';
import { colors } from '../config/theme';

const Tab = createMaterialTopTabNavigator<InfosTabParamList>();

function TopTab() {
  return (
    <Tab.Navigator
      initialRouteName="UsefulNumbers"
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
      }}
    >
      <Tab.Screen
        name="UsefulNumbers"
        component={UsefulNumbers}
        options={{
          tabBarLabel: ({ focused }) => (
            <Entypo
              size={25}
              name="old-phone"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Regulations"
        component={Regulations}
        options={{
          tabBarLabel: ({ focused }) => (
            <Entypo
              size={25}
              name="book"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Weather"
        component={Weather}
        options={{
          tabBarLabel: ({ focused }) => (
            <Ionicons
              size={25}
              name="sunny"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function TopTabInfos() {
  return (
    <SafeAreaProvider>
      <Header iconName="info-circle" title="Infos utiles" />
      <TopTab />
    </SafeAreaProvider>
  );
}
