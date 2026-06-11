import type { ReunionDto } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function listerReunions(sejourId: number): Promise<ReunionDto[]> {
  try {
    const response = await Axios.get<ReunionDto[]>(`/sejours/${sejourId}/reunions`);
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des réunions',
      logContext: 'sejour-reunion listerReunions',
    });
  }
}

export const sejourReunionService = {
  listerReunions,
};
