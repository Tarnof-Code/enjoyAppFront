import * as React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

import Activites from '../screens/Activities/Activites';
import Sorties from '../screens/Activities/Sorties';
import { creerTopTab } from './creerTopTab';
import type { ActivitiesTabParamList } from './types';
import { colors } from '../config/theme';

const couleur = (focused: boolean) => (focused ? colors.ink : colors.disabled);

export default creerTopTab<ActivitiesTabParamList>({
  headerIcon: 'dice',
  headerTitle: '  Activités',
  onglets: [
    {
      name: 'Activites',
      component: Activites,
      icon: (f) => <MaterialIcons size={25} name="local-activity" color={couleur(f)} />,
    },
    {
      name: 'Sorties',
      component: Sorties,
      icon: (f) => <MaterialCommunityIcons size={25} name="bus" color={couleur(f)} />,
    },
  ],
});
