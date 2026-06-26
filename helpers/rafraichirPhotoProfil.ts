import { utilisateurService } from '../services/utilisateur.service';
import { store } from '../store';
import { bumpPhotoProfilRevision, setPhotoProfilUri } from '../store/authSlice';

/** Recharge la photo de profil depuis l'API et met à jour le store Redux. */
export async function chargerPhotoProfilDansStore(): Promise<void> {
  const { tokenId } = store.getState().auth;
  if (!tokenId) {
    store.dispatch(setPhotoProfilUri(null));
    return;
  }

  const uri = await utilisateurService.getPhotoProfilDataUri(tokenId, Date.now());
  store.dispatch(setPhotoProfilUri(uri));
}

/**
 * Rafraîchissement explicite (pull-to-refresh) : recharge la photo
 * et force le remontage des composants Image du header / accueil.
 */
export async function rafraichirPhotoProfil(): Promise<void> {
  await chargerPhotoProfilDansStore();
  store.dispatch(bumpPhotoProfilRevision());
}
