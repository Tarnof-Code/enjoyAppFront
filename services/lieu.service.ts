import type { LieuDto } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getLieuxBySejour(sejourId: number): Promise<LieuDto[]> {
  try {
    const response = await Axios.get<LieuDto[]>(`/sejours/${sejourId}/lieux`);
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des lieux',
      logContext: 'lieu getLieuxBySejour',
    });
  }
}

export const lieuService = {
  getLieuxBySejour,
};
