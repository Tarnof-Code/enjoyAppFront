import type { GroupeDto } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getGroupesBySejour(sejourId: number): Promise<GroupeDto[]> {
  try {
    const response = await Axios.get<GroupeDto[]>(`/sejours/${sejourId}/groupes`);
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des groupes',
      logContext: 'groupe getGroupesBySejour',
    });
  }
}

export const groupeService = {
  getGroupesBySejour,
};
