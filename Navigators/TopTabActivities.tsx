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
  barreOngletsCompacte: true,
  onglets: [
    {
      name: 'Activites',
      title: 'Planning',
      component: Activites,
      icon: (f) => (
        <MaterialCommunityIcons size={20} name="calendar-blank" color={couleur(f)} />
      ),
    },
    {
      name: 'Sorties',
      title: 'Sorties',
      component: Sorties,
      icon: (f) => <MaterialCommunityIcons size={20} name="bus" color={couleur(f)} />,
    },
  ],
});
