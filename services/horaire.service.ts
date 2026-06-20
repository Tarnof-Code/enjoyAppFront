import type { HoraireDto } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getHorairesBySejour(sejourId: number): Promise<HoraireDto[]> {
  try {
    const response = await Axios.get<HoraireDto[]>(`/sejours/${sejourId}/horaires`);
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des horaires',
      logContext: 'horaire getHorairesBySejour',
    });
  }
}

export const horaireService = {
  getHorairesBySejour,
};
