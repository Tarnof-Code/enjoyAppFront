import * as React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Foundation } from '@expo/vector-icons';

import GeneralHealth from '../screens/Health/GeneralHealth';
import EatingHealth from '../screens/Health/EatingHealth';
import MedicalTreatments from '../screens/Health/MedicalTreatments';
import WhatToDoIf from '../screens/Health/WhatToDoIf';
import Header from '../Components/Header';
import type { HealthTabParamList } from './types';
import { colors } from '../config/theme';

const Tab = createMaterialTopTabNavigator<HealthTabParamList>();

function TopTab() {
  return (
    <Tab.Navigator
      initialRouteName="GeneralHealth"
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
      }}
    >
      <Tab.Screen
        name="GeneralHealth"
        component={GeneralHealth}
        options={{
          tabBarLabel: ({ focused }) => (
            <Foundation
              size={25}
              name="torsos-all"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />

      <Tab.Screen
        name="EatingHealth"
        component={EatingHealth}
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
        name="MedicalTreatments"
        component={MedicalTreatments}
        options={{
          tabBarLabel: ({ focused }) => (
            <MaterialCommunityIcons
              size={25}
              name="pill"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />

      <Tab.Screen
        name="WhatToDoIf"
        component={WhatToDoIf}
        options={{
          tabBarLabel: ({ focused }) => (
            <MaterialCommunityIcons
              size={25}
              name="account-question"
              color={focused ? colors.ink : colors.disabled}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function TopTabHealth() {
  return (
    <SafeAreaProvider>
      <Header iconName="notes-medical" title="Sanitaire" />
      <TopTab />
    </SafeAreaProvider>
  );
}
