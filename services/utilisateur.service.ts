import type {
  ChangePasswordRequest,
  ProfilUtilisateurDTO,
  UpdateUserRequest,
} from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import { arrayBufferToDataUri } from '../helpers/photoProfil';
import Axios from './httpClient';

const PHOTO_PROFIL_MAX_BYTES = 2 * 1024 * 1024;
const PHOTO_PROFIL_TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface PhotoProfilAsset {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}

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
      params: { _: cacheBust ?? Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
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

export async function updateUser(utilisateur: UpdateUserRequest): Promise<void> {
  try {
    await Axios.put('/utilisateurs', utilisateur, {
      withCredentials: true,
      headers: {
        'X-Skip-Token-Refresh': 'true',
      },
    });
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors de la mise à jour du profil',
      logContext: 'utilisateur updateUser',
    });
  }
}

export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  try {
    await Axios.patch('/utilisateurs/mot-de-passe', request, {
      withCredentials: true,
    });
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du changement de mot de passe',
      logContext: 'utilisateur changePassword',
    });
  }
}

function validerPhotoProfil(asset: PhotoProfilAsset): void {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  if (!PHOTO_PROFIL_TYPES_ACCEPTES.includes(mimeType as (typeof PHOTO_PROFIL_TYPES_ACCEPTES)[number])) {
    throw new Error('Format non accepté. Utilisez une image JPEG, PNG ou WebP.');
  }
  if (asset.fileSize != null && asset.fileSize > PHOTO_PROFIL_MAX_BYTES) {
    throw new Error('La photo ne doit pas dépasser 2 Mo.');
  }
}

export async function uploadPhotoProfil(
  tokenId: string,
  asset: PhotoProfilAsset,
): Promise<ProfilUtilisateurDTO> {
  validerPhotoProfil(asset);

  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName ?? 'photo.jpg',
    type: asset.mimeType ?? 'image/jpeg',
  } as unknown as Blob);

  try {
    const response = await Axios.post<ProfilUtilisateurDTO>(
      `/utilisateurs/${tokenId}/photo-profil`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: "Erreur lors de l'envoi de la photo de profil",
      logContext: 'utilisateur uploadPhotoProfil',
    });
  }
}

export async function deletePhotoProfil(tokenId: string): Promise<void> {
  try {
    await Axios.delete(`/utilisateurs/${tokenId}/photo-profil`, {
      withCredentials: true,
    });
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors de la suppression de la photo de profil',
      logContext: 'utilisateur deletePhotoProfil',
    });
  }
}

/** Supprime l'ancienne photo si elle existe (404 ignoré), puis envoie la nouvelle. */
export async function remplacerPhotoProfil(
  tokenId: string,
  asset: PhotoProfilAsset,
): Promise<ProfilUtilisateurDTO> {
  try {
    await Axios.delete(`/utilisateurs/${tokenId}/photo-profil`, {
      withCredentials: true,
    });
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status !== 404) {
      adaptAxiosError(error, {
        defaultMessage: 'Erreur lors du remplacement de la photo de profil',
        logContext: 'utilisateur remplacerPhotoProfil delete',
      });
    }
  }

  return uploadPhotoProfil(tokenId, asset);
}

export const utilisateurService = {
  getProfilByTokenId,
  getPhotoProfilDataUri,
  updateUser,
  changePassword,
  uploadPhotoProfil,
  remplacerPhotoProfil,
  deletePhotoProfil,
};
