import * as React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Foundation } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

import General from '../screens/Lists/General';
import Crabs from '../screens/Lists/Crabs';
import Sharks from '../screens/Lists/Sharks';
import Octopuses from '../screens/Lists/Octopuses';
import Animators from '../screens/Lists/Animators';
import Bedrooms from '../screens/Lists/Bedrooms';
import Header from '../Components/Header';
import type { ListsTabParamList } from './types';

const Tab = createMaterialTopTabNavigator<ListsTabParamList>();

function TopTab() {
  return (
    <Tab.Navigator
      initialRouteName="General"
      screenOptions={{
        tabBarActiveTintColor: '#000000',
      }}
    >
      <Tab.Screen
        name="General"
        component={General}
        options={{
          tabBarLabel: ({ focused }) => (
            <Foundation
              size={25}
              name="torsos-all"
              color={focused ? '#000000' : '#b2bec3'}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Crabs"
        component={Crabs}
        options={{
          tabBarLabel: ({ focused }) => (
            <FontAwesome5
              size={25}
              name="pastafarianism"
              color={focused ? '#000000' : '#b2bec3'}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Sharks"
        component={Sharks}
        options={{
          tabBarLabel: ({ focused }) => (
            <MaterialCommunityIcons
              size={25}
              name="shark-fin"
              color={focused ? '#000000' : '#b2bec3'}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Octopuses"
        component={Octopuses}
        options={{
          tabBarLabel: ({ focused }) => (
            <FontAwesome5
              size={25}
              name="octopus-deploy"
              color={focused ? '#000000' : '#b2bec3'}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Animators"
        component={Animators}
        options={{
          tabBarLabel: ({ focused }) => (
            <MaterialIcons
              size={25}
              name="sports-kabaddi"
              color={focused ? '#000000' : '#b2bec3'}
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
              color={focused ? '#000000' : '#b2bec3'}
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
