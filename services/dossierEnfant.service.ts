import type { DossierEnfantDto, EnfantDossierSanitaireLigneDto } from '../types/api';
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

export async function getDossierEnfant(
  sejourId: number,
  enfantId: number,
): Promise<DossierEnfantDto> {
  try {
    const response = await Axios.get<DossierEnfantDto>(
      `/sejours/${sejourId}/enfants/${enfantId}/dossier`,
    );
    return {
      ...response.data,
      allergenes: response.data.allergenes ?? [],
      regimesEtPreferences: response.data.regimesEtPreferences ?? [],
    };
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors de la récupération du dossier',
      logContext: 'dossierEnfant getDossierEnfant',
    });
  }
}

export const dossierEnfantService = {
  getDossiersSanitairesBySejour,
  getDossierEnfant,
};
