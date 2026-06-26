import * as React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Activites from '../screens/Activities/Activites';
import Sorties from '../screens/Activities/Sorties';
import { creerTopTab } from './creerTopTab';
import type { ActivitiesTabParamList } from './types';
import { colors } from '../config/theme';

const couleur = (focused: boolean) => (focused ? colors.primary : colors.disabled);

export default creerTopTab<ActivitiesTabParamList>({
  headerIcon: 'dice',
  onglets: [
    {
      name: 'Activites',
      title: 'Planning',
      component: Activites,
      afficherLibelle: false,
      icon: (f) => (
        <MaterialCommunityIcons size={25} name="calendar-blank" color={couleur(f)} />
      ),
    },
    {
      name: 'Sorties',
      title: 'Sorties',
      component: Sorties,
      afficherLibelle: false,
      icon: (f) => <MaterialCommunityIcons size={25} name="bus" color={couleur(f)} />,
    },
  ],
});
