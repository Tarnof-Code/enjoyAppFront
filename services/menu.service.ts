import type { MenuRepasDto } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getMenusBySejour(
  sejourId: number,
  dateDebut: string,
  dateFin: string,
): Promise<MenuRepasDto[]> {
  try {
    const response = await Axios.get<MenuRepasDto[]>(`/sejours/${sejourId}/menus`, {
      params: { dateDebut, dateFin },
    });
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des menus',
      logContext: 'menu getMenusBySejour',
    });
  }
}

export const menuService = {
  getMenusBySejour,
};
