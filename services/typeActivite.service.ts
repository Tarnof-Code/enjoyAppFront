import type { TypeActiviteDto } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getTypesActiviteBySejour(sejourId: number): Promise<TypeActiviteDto[]> {
  try {
    const response = await Axios.get<TypeActiviteDto[]>(`/sejours/${sejourId}/types-activite`);
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des types d’activité',
      logContext: 'typeActivite getTypesActiviteBySejour',
    });
  }
}

export const typeActiviteService = {
  getTypesActiviteBySejour,
};
