import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Organisation from '../screens/Organisation/Organisation';
import GrilleDetail from '../screens/Organisation/GrilleDetail';
import type { OrganisationStackParamList } from './types';

const Stack = createNativeStackNavigator<OrganisationStackParamList>();

export default function OrganisationNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GrillesList" component={Organisation} />
      <Stack.Screen name="GrilleDetail" component={GrilleDetail} />
    </Stack.Navigator>
  );
}
