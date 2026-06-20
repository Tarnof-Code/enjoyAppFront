import type { ActivitePrestataireDto } from '../types/api';
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

export const activitePrestataireService = {
  getActivitesPrestatairesBySejour,
};
