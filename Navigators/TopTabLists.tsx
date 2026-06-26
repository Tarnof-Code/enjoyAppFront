import * as React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Animators from '../screens/Lists/Animators';
import Children from '../screens/Lists/Children';
import Groups from '../screens/Lists/Groups';
import Bedrooms from '../screens/Lists/Bedrooms';
import { creerTopTab } from './creerTopTab';
import type { ListsTabParamList } from './types';
import { colors } from '../config/theme';

const couleur = (focused: boolean) => (focused ? colors.primary : colors.disabled);

export default creerTopTab<ListsTabParamList>({
  headerIcon: 'list-ul',
  onglets: [
    {
      name: 'Animators',
      title: 'Équipe',
      component: Animators,
      icon: (f) => (
        <MaterialCommunityIcons size={25} name="badge-account-horizontal" color={couleur(f)} />
      ),
    },
    {
      name: 'Children',
      title: 'Enfants',
      component: Children,
      icon: (f) => <MaterialCommunityIcons size={25} name="human-child" color={couleur(f)} />,
    },
    {
      name: 'Groups',
      title: 'Groupes',
      component: Groups,
      icon: (f) => <MaterialCommunityIcons size={25} name="account-group" color={couleur(f)} />,
    },
    {
      name: 'Bedrooms',
      title: 'Chambres',
      component: Bedrooms,
      icon: (f) => <FontAwesome size={25} name="bed" color={couleur(f)} />,
    },
  ],
});
