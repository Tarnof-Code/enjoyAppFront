import { useCallback } from 'react';

import { rafraichirSejourCourant } from '../helpers/rafraichirSejourCourant';

/**
 * Recharge le séjour courant depuis l'API et met à jour le store.
 *
 * À utiliser hors `useChargementRafraichissable` (ex. pull-to-refresh manuel).
 * Le hook de chargement rafraîchit déjà le séjour au tirer-pour-actualiser.
 */
export function useRafraichirSejourCourant(): () => Promise<void> {
  return useCallback(() => rafraichirSejourCourant(), []);
}
