import { useCallback } from 'react';

import { sejourService } from '../services/sejour.service';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSejourCourant } from '../store/sejourSlice';

/**
 * Recharge le séjour courant depuis l'API et met à jour le store.
 *
 * À inclure dans le `executer` des écrans afin que le pull-to-refresh prenne
 * en compte les réglages partagés du séjour (ex. tri des listes enfants / équipe),
 * et pas seulement les données propres à l'écran.
 */
export function useRafraichirSejourCourant(): () => Promise<void> {
  const dispatch = useAppDispatch();
  const sejourId = useAppSelector((state) => state.sejour.sejourCourant?.id);

  return useCallback(async () => {
    if (sejourId == null) return;
    const sejour = await sejourService.getSejourById(sejourId);
    dispatch(setSejourCourant(sejour));
  }, [sejourId, dispatch]);
}
