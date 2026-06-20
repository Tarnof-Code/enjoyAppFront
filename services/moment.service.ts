import type { MomentDto } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getMomentsBySejour(sejourId: number): Promise<MomentDto[]> {
  try {
    const response = await Axios.get<MomentDto[]>(`/sejours/${sejourId}/moments`);
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des moments',
      logContext: 'moment getMomentsBySejour',
    });
  }
}

export const momentService = {
  getMomentsBySejour,
};
