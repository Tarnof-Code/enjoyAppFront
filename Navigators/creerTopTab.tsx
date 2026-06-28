import * as React from 'react';
import { useState } from 'react';
import { View } from 'react-native';
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
  /** Libellé texte sous l’icône dans la barre d’onglets (défaut : true). */
  afficherLibelle?: boolean;
}

interface TopTabOptions<ParamList extends ParamListBase> {
  headerIcon: string;
  onglets: OngletConfig<ParamList>[];
  /** Barre d’onglets plus basse (icône + libellé). */
  barreOngletsCompacte?: boolean;
}

/**
 * Fabrique un navigateur à onglets supérieurs (Header + material-top-tabs)
 * à partir d'une configuration déclarative. Le titre du Header suit
 * l'onglet actif (chaque onglet porte son propre `title`).
 */
export function creerTopTab<ParamList extends ParamListBase>({
  headerIcon,
  onglets,
  barreOngletsCompacte = false,
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
          screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.disabled,
            ...(barreOngletsCompacte
              ? {
                  tabBarStyle: { height: 50 },
                  tabBarItemStyle: { minHeight: 50, paddingVertical: 0 },
                  tabBarLabelStyle: {
                    fontSize: 10,
                    textTransform: 'none',
                    marginTop: 0,
                    marginBottom: 2,
                  },
                }
              : {
                  tabBarLabelStyle: {
                    fontSize: 11,
                    textTransform: 'none',
                  },
                }),
          }}
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
              options={{
                ...(onglet.afficherLibelle !== false ? { title: onglet.title } : { tabBarShowLabel: false }),
                tabBarIcon: ({ focused }) => <View>{onglet.icon(focused)}</View>,
              }}
            />
          ))}
        </Tab.Navigator>
      </SafeAreaProvider>
    );
  };
}
