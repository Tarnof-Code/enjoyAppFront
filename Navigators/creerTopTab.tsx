import * as React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ParamListBase } from '@react-navigation/native';

import Header from '../Components/Header';
import { colors } from '../config/theme';

export interface OngletConfig<ParamList extends ParamListBase> {
  name: Extract<keyof ParamList, string>;
  component: React.ComponentType<Record<string, never>>;
  icon: (focused: boolean) => React.ReactNode;
}

interface TopTabOptions<ParamList extends ParamListBase> {
  headerIcon: string;
  headerTitle: string;
  onglets: OngletConfig<ParamList>[];
}

/**
 * Fabrique un navigateur à onglets supérieurs (Header + material-top-tabs)
 * à partir d'une configuration déclarative, pour éviter la duplication
 * entre les écrans de type liste/onglets.
 */
export function creerTopTab<ParamList extends ParamListBase>({
  headerIcon,
  headerTitle,
  onglets,
}: TopTabOptions<ParamList>): React.ComponentType {
  const Tab = createMaterialTopTabNavigator<ParamList>();

  return function TopTabNavigateur() {
    return (
      <SafeAreaProvider>
        <Header iconName={headerIcon} title={headerTitle} />
        <Tab.Navigator
          initialRouteName={onglets[0]?.name}
          screenOptions={{ tabBarActiveTintColor: colors.ink }}
        >
          {onglets.map((onglet) => (
            <Tab.Screen
              key={onglet.name}
              name={onglet.name}
              component={onglet.component}
              options={{ tabBarLabel: ({ focused }) => onglet.icon(focused) }}
            />
          ))}
        </Tab.Navigator>
      </SafeAreaProvider>
    );
  };
}
