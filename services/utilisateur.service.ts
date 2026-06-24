import type { ProfilUtilisateurDTO } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import { arrayBufferToDataUri } from '../helpers/photoProfil';
import Axios from './httpClient';

export async function getProfilByTokenId(tokenId: string): Promise<ProfilUtilisateurDTO> {
  try {
    const response = await Axios.get<ProfilUtilisateurDTO>(`/utilisateurs/profil?tokenId=${tokenId}`);
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement du profil utilisateur',
      logContext: 'utilisateur getProfilByTokenId',
    });
  }
}

export async function getPhotoProfilDataUri(
  tokenId: string,
  cacheBust?: number,
): Promise<string | null> {
  try {
    const response = await Axios.get<ArrayBuffer>(`/utilisateurs/${tokenId}/photo-profil`, {
      withCredentials: true,
      responseType: 'arraybuffer',
      params: cacheBust != null ? { _: cacheBust } : undefined,
    });
    const mimeType =
      (response.headers['content-type'] as string | undefined) ?? 'image/jpeg';
    return arrayBufferToDataUri(response.data, mimeType);
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 404) {
      return null;
    }
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement de la photo de profil',
      logContext: 'utilisateur getPhotoProfilDataUri',
    });
  }
}

export const utilisateurService = {
  getProfilByTokenId,
  getPhotoProfilDataUri,
};
