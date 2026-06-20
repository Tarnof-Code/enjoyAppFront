import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  SejourPicker: undefined;
  BottomTab: NavigatorScreenParams<BottomTabParamList>;
};

export type BottomTabParamList = {
  Home: undefined;
  Listes: undefined;
  'Activités': undefined;
  Sanitaire: undefined;
};

export type ListsTabParamList = {
  General: undefined;
  Crabs: undefined;
  Sharks: undefined;
  Octopuses: undefined;
  Animators: undefined;
  Bedrooms: undefined;
};

export type ActivitiesTabParamList = {
  DaytimeActivities: undefined;
  EveningActivities: undefined;
  Trips: undefined;
};

export type HealthTabParamList = {
  GeneralHealth: undefined;
  EatingHealth: undefined;
  MedicalTreatments: undefined;
  WhatToDoIf: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
