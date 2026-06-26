import { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { chargerPhotoProfilDansStore } from '../helpers/rafraichirPhotoProfil';

/** Charge la photo de profil dans le store Redux (header, accueil, etc.). */
export function usePhotoProfilLoader() {
  const chargerPhoto = useCallback(async () => {
    try {
      await chargerPhotoProfilDansStore();
    } catch {
      /* photo indisponible : on conserve l'état courant */
    }
  }, []);

  useEffect(() => {
    void chargerPhoto();
  }, [chargerPhoto]);

  useFocusEffect(
    useCallback(() => {
      void chargerPhoto();
    }, [chargerPhoto]),
  );
}
