import * as React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Fontisto } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

import Holidays from '../screens/Plannings/Holidays';
import Laundry from '../screens/Plannings/Laundry';
import MealTime from '../screens/Plannings/MealTime';
import Surveillance from '../screens/Plannings/Surveillance';
import WakeUp from '../screens/Plannings/WakeUp';
import Header from '../Components/Header';
import type { PlanningsTabParamList } from './types';
import { colors } from '../config/theme';

const Tab = createMaterialTopTabNavigator<PlanningsTabParamList>();

function TopTab() {
  return (
    <Tab.Navigator
      initialRouteName="WakeUp"
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
      }}
    >
      <Tab.Screen
        name="WakeUp"
        component={WakeUp}
        options={{
          tabBarLabel: ({ focused }) => (
            <Ionicons
              size={25}
              name="alarm"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />

      <Tab.Screen
        name="MealTime"
        component={MealTime}
        options={{
          tabBarLabel: ({ focused }) => (
            <MaterialCommunityIcons
              size={25}
              name="silverware-fork-knife"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Surveillance"
        component={Surveillance}
        options={{
          tabBarLabel: ({ focused }) => (
            <MaterialIcons
              size={25}
              name="local-police"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Laundry"
        component={Laundry}
        options={{
          tabBarLabel: ({ focused }) => (
            <MaterialIcons
              size={25}
              name="local-laundry-service"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Holidays"
        component={Holidays}
        options={{
          tabBarLabel: ({ focused }) => (
            <Fontisto
              size={25}
              name="holiday-village"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function TopTabPlannings() {
  return (
    <SafeAreaProvider>
      <Header iconName="calendar-alt" title="Plannings" />
      <TopTab />
    </SafeAreaProvider>
  );
}
