import type { ActiviteDto } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getActivitesBySejour(sejourId: number): Promise<ActiviteDto[]> {
  try {
    const response = await Axios.get<ActiviteDto[]>(`/sejours/${sejourId}/activites`);
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des activités',
      logContext: 'activite getActivitesBySejour',
    });
  }
}

export const activiteService = {
  getActivitesBySejour,
};
