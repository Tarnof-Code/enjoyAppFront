import * as React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

import Activites from '../screens/Activities/Activites';
import Sorties from '../screens/Activities/Sorties';
import Header from '../Components/Header';
import type { ActivitiesTabParamList } from './types';
import { colors } from '../config/theme';

const Tab = createMaterialTopTabNavigator<ActivitiesTabParamList>();

function TopTab() {
  return (
    <Tab.Navigator
      initialRouteName="Activites"
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
      }}
    >
      <Tab.Screen
        name="Activites"
        component={Activites}
        options={{
          tabBarLabel: ({ focused }) => (
            <MaterialIcons
              size={25}
              name="local-activity"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Sorties"
        component={Sorties}
        options={{
          tabBarLabel: ({ focused }) => (
            <MaterialCommunityIcons
              size={25}
              name="bus"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function TopTabActivities() {
  return (
    <SafeAreaProvider>
      <Header iconName="dice" title="  Activités" />
      <TopTab />
    </SafeAreaProvider>
  );
}
