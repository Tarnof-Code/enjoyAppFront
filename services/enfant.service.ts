import type { EnfantDto } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getEnfantsBySejour(sejourId: number): Promise<EnfantDto[]> {
  try {
    const response = await Axios.get<EnfantDto[]>(`/sejours/${sejourId}/enfants`);
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des enfants',
      logContext: 'enfant getEnfantsBySejour',
    });
  }
}

export const enfantService = {
  getEnfantsBySejour,
};
