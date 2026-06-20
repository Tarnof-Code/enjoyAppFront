import * as React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

import Animators from '../screens/Lists/Animators';
import Bedrooms from '../screens/Lists/Bedrooms';
import Header from '../Components/Header';
import type { ListsTabParamList } from './types';
import { colors } from '../config/theme';

const Tab = createMaterialTopTabNavigator<ListsTabParamList>();

function TopTab() {
  return (
    <Tab.Navigator
      initialRouteName="Animators"
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
      }}
    >
      <Tab.Screen
        name="Animators"
        component={Animators}
        options={{
          tabBarLabel: ({ focused }) => (
            <MaterialIcons
              size={25}
              name="sports-kabaddi"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Bedrooms"
        component={Bedrooms}
        options={{
          tabBarLabel: ({ focused }) => (
            <FontAwesome
              size={25}
              name="bed"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function TopTabLists() {
  return (
    <SafeAreaProvider>
      <Header iconName="list-ul" title=" Listes" />
      <TopTab />
    </SafeAreaProvider>
  );
}
