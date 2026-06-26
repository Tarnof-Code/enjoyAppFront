import * as React from 'react';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

import CahierInfirmerie from '../screens/Health/CahierInfirmerie';
import DossierSanitaire from '../screens/Health/DossierSanitaire';
import { creerTopTab } from './creerTopTab';
import type { SanitaireTabParamList } from './types';
import { colors } from '../config/theme';

const couleur = (focused: boolean) => (focused ? colors.primary : colors.disabled);

export default creerTopTab<SanitaireTabParamList>({
  headerIcon: 'notes-medical',
  onglets: [
    {
      name: 'CahierInfirmerie',
      title: "Cahier d'infirmerie",
      component: CahierInfirmerie,
      icon: (f) => <FontAwesome5 size={22} name="book-medical" color={couleur(f)} />,
    },
    {
      name: 'DossierSanitaire',
      title: 'Dossiers sanitaires',
      component: DossierSanitaire,
      icon: (f) => (
        <MaterialCommunityIcons size={25} name="clipboard-pulse-outline" color={couleur(f)} />
      ),
    },
  ],
});
