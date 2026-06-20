import type { ChambreDto } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getChambresBySejour(sejourId: number): Promise<ChambreDto[]> {
  try {
    const response = await Axios.get<ChambreDto[]>(`/sejours/${sejourId}/chambres`);
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des chambres',
      logContext: 'chambre getChambresBySejour',
    });
  }
}

export const chambreService = {
  getChambresBySejour,
};
