import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  SejourPicker: undefined;
  BottomTab: NavigatorScreenParams<BottomTabParamList>;
};

export type BottomTabParamList = {
  Home: undefined;
  Listes: undefined;
  Organisation: undefined;
  Menus: undefined;
  'Activités': undefined;
  Sanitaire: undefined;
};

export type ListsTabParamList = {
  Animators: undefined;
  Children: undefined;
  Groups: undefined;
  Bedrooms: undefined;
};

export type ActivitiesTabParamList = {
  Activites: undefined;
  Sorties: undefined;
};

export type HealthTabParamList = {
  GeneralHealth: undefined;
  EatingHealth: undefined;
  MedicalTreatments: undefined;
  WhatToDoIf: undefined;
};

export type OrganisationStackParamList = {
  GrillesList: undefined;
  GrilleDetail: { grilleId: number; titre: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
