import * as React from 'react';
import { useState } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ParamListBase } from '@react-navigation/native';

import Header from '../Components/Header';
import { colors } from '../config/theme';

export interface OngletConfig<ParamList extends ParamListBase> {
  name: Extract<keyof ParamList, string>;
  title: string;
  component: React.ComponentType<Record<string, never>>;
  icon: (focused: boolean) => React.ReactNode;
}

interface TopTabOptions<ParamList extends ParamListBase> {
  headerIcon: string;
  onglets: OngletConfig<ParamList>[];
}

/**
 * Fabrique un navigateur à onglets supérieurs (Header + material-top-tabs)
 * à partir d'une configuration déclarative. Le titre du Header suit
 * l'onglet actif (chaque onglet porte son propre `title`).
 */
export function creerTopTab<ParamList extends ParamListBase>({
  headerIcon,
  onglets,
}: TopTabOptions<ParamList>): React.ComponentType {
  const Tab = createMaterialTopTabNavigator<ParamList>();
  const titreParOnglet = new Map(onglets.map((o) => [o.name, o.title]));

  return function TopTabNavigateur() {
    const [titre, setTitre] = useState(onglets[0]?.title ?? '');

    return (
      <SafeAreaProvider>
        <Header iconName={headerIcon} title={titre} />
        <Tab.Navigator
          initialRouteName={onglets[0]?.name}
          screenOptions={{ tabBarActiveTintColor: colors.ink }}
          screenListeners={{
            state: (e) => {
              const state = e.data?.state;
              if (!state) return;
              const nom = state.routes[state.index]?.name;
              const nouveauTitre = nom ? titreParOnglet.get(nom) : undefined;
              if (nouveauTitre) setTitre(nouveauTitre);
            },
          }}
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
