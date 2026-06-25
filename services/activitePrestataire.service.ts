import type { ActivitePrestataireDto, SaveActivitePrestataireRequest } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getActivitesPrestatairesBySejour(
  sejourId: number,
): Promise<ActivitePrestataireDto[]> {
  try {
    const response = await Axios.get<ActivitePrestataireDto[]>(
      `/sejours/${sejourId}/activites-prestataires`,
    );
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des sorties',
      logContext: 'activitePrestataire getActivitesPrestatairesBySejour',
    });
  }
}

export async function modifierActivitePrestataire(
  sejourId: number,
  activitePrestataireId: number,
  body: SaveActivitePrestataireRequest,
): Promise<ActivitePrestataireDto> {
  try {
    const response = await Axios.put<ActivitePrestataireDto>(
      `/sejours/${sejourId}/activites-prestataires/${activitePrestataireId}`,
      body,
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors de la mise à jour de la sortie',
      logContext: 'activitePrestataire modifierActivitePrestataire',
      preserveResponseData: true,
    });
  }
}

export const activitePrestataireService = {
  getActivitesPrestatairesBySejour,
  modifierActivitePrestataire,
};
