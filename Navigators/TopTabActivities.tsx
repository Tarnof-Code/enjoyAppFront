import * as React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

import DaytimeActivities from '../screens/Activities/DaytimeActivities';
import EveningActivities from '../screens/Activities/EveningActivities';
import Trips from '../screens/Activities/Trips';
import Header from '../Components/Header';
import type { ActivitiesTabParamList } from './types';
import { colors } from '../config/theme';

const Tab = createMaterialTopTabNavigator<ActivitiesTabParamList>();

function TopTab() {
  return (
    <Tab.Navigator
      initialRouteName="DaytimeActivities"
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
      }}
    >
      <Tab.Screen
        name="DaytimeActivities"
        component={DaytimeActivities}
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
        name="EveningActivities"
        component={EveningActivities}
        options={{
          tabBarLabel: ({ focused }) => (
            <Ionicons
              size={25}
              name="moon"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Trips"
        component={Trips}
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
