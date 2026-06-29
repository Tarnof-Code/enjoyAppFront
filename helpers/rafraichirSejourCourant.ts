import { sejourService } from '../services/sejour.service';
import { store } from '../store';
import { setSejourCourant } from '../store/sejourSlice';

/** Recharge le séjour courant depuis l'API et met à jour le store Redux. */
export async function rafraichirSejourCourant(): Promise<void> {
  const sejourId = store.getState().sejour.sejourCourant?.id;
  if (sejourId == null) return;
  const sejour = await sejourService.getSejourById(sejourId);
  store.dispatch(setSejourCourant(sejour));
}
