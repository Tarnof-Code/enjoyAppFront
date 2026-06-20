import type { EnfantDossierSanitaireLigneDto } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getDossiersSanitairesBySejour(
  sejourId: number,
): Promise<EnfantDossierSanitaireLigneDto[]> {
  try {
    const response = await Axios.get<EnfantDossierSanitaireLigneDto[]>(
      `/sejours/${sejourId}/dossiers-enfants`,
    );
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des fiches sanitaires',
      logContext: 'dossierEnfant getDossiersSanitairesBySejour',
    });
  }
}

export const dossierEnfantService = {
  getDossiersSanitairesBySejour,
};
