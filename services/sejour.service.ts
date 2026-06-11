import type { SejourDTO } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';
import { accountService } from './account.service';

export async function getAllSejoursByUtilisateur(): Promise<SejourDTO[]> {
  try {
    const tokenInfo = await accountService.getTokenInfo();
    const utilisateurTokenId = tokenInfo?.payload?.sub;
    if (!utilisateurTokenId) {
      throw new Error('Impossible de récupérer le token ID de l’utilisateur');
    }
    const response = await Axios.get<SejourDTO[]>(`/sejours/utilisateur/${utilisateurTokenId}`);
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement de vos séjours',
      logContext: 'sejour getAllSejoursByUtilisateur',
    });
  }
}

export async function getSejourById(id: number): Promise<SejourDTO> {
  try {
    const response = await Axios.get<SejourDTO>(`/sejours/${id}`);
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement du séjour',
      logContext: 'sejour getSejourById',
    });
  }
}

export const sejourService = {
  getAllSejoursByUtilisateur,
  getSejourById,
};
