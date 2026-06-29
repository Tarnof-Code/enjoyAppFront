import { useCallback, useEffect, useState } from 'react';

import { getUserFacingErrorMessage } from '../helpers/axiosError';
import { rafraichirPhotoProfil } from '../helpers/rafraichirPhotoProfil';
import { rafraichirSejourCourant } from '../helpers/rafraichirSejourCourant';

/**
 * Gère le cycle de chargement d'un écran alimenté par l'API avec
 * rafraîchissement « tirer pour actualiser » (pull-to-refresh).
 *
 * `executer` effectue la récupération et met à jour l'état de l'écran ;
 * le hook prend en charge les indicateurs `loading` (premier chargement),
 * `refreshing` (rafraîchissement) et la gestion d'erreur centralisée.
 * Au rafraîchissement, le séjour courant et la photo de profil du header sont aussi rechargés.
 */
export function useChargementRafraichissable(
  executer: () => Promise<void>,
  messageErreur: string,
): {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charger = useCallback(
    async (estRafraichissement: boolean) => {
      if (estRafraichissement) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        if (estRafraichissement) {
          await Promise.all([
            executer(),
            rafraichirPhotoProfil().catch(() => {}),
            rafraichirSejourCourant().catch(() => {}),
          ]);
        } else {
          await executer();
        }
      } catch (err) {
        setError(getUserFacingErrorMessage(err, messageErreur));
      } finally {
        if (estRafraichissement) setRefreshing(false);
        else setLoading(false);
      }
    },
    [executer, messageErreur],
  );

  useEffect(() => {
    void charger(false);
  }, [charger]);

  const refresh = useCallback(() => {
    void charger(true);
  }, [charger]);

  return { loading, refreshing, error, refresh };
}
