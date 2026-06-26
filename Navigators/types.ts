import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  SejourPicker: undefined;
  BottomTab: NavigatorScreenParams<BottomTabParamList>;
};

export type BottomTabParamList = {
  Home: undefined;
  Listes: undefined;
  Orga: undefined;
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

export type SanitaireTabParamList = {
  CahierInfirmerie: undefined;
  DossierSanitaire: undefined;
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
