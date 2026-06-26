import type {
  ActivitePrestataireDto,
  SaveActivitePrestataireRequest,
  UpdateActivitePrestataireEnfantsRequest,
} from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getActivitesPrestatairesBySejour(
  sejourId: number,
): Promise<ActivitePrestataireDto[]> {
  try {
    const response = await Axios.get<ActivitePrestataireDto[]>(
      `/sejours/${sejourId}/activites-prestataires`,
    );
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des sorties',
      logContext: 'activitePrestataire getActivitesPrestatairesBySejour',
    });
  }
}

export async function getActivitePrestataireById(
  sejourId: number,
  activitePrestataireId: number,
): Promise<ActivitePrestataireDto> {
  try {
    const response = await Axios.get<ActivitePrestataireDto>(
      `/sejours/${sejourId}/activites-prestataires/${activitePrestataireId}`,
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement de la sortie',
      logContext: 'activitePrestataire getActivitePrestataireById',
    });
  }
}

export async function modifierEnfantsActivitePrestataire(
  sejourId: number,
  activitePrestataireId: number,
  body: UpdateActivitePrestataireEnfantsRequest,
): Promise<ActivitePrestataireDto> {
  try {
    const response = await Axios.put<ActivitePrestataireDto>(
      `/sejours/${sejourId}/activites-prestataires/${activitePrestataireId}/enfants`,
      body,
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors de la mise à jour des enfants participants',
      logContext: 'activitePrestataire modifierEnfantsActivitePrestataire',
      preserveResponseData: true,
    });
  }
}

export async function modifierActivitePrestataire(
  sejourId: number,
  activitePrestataireId: number,
  body: SaveActivitePrestataireRequest,
): Promise<ActivitePrestataireDto> {
  try {
    const response = await Axios.put<ActivitePrestataireDto>(
      `/sejours/${sejourId}/activites-prestataires/${activitePrestataireId}`,
      body,
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors de la mise à jour de la sortie',
      logContext: 'activitePrestataire modifierActivitePrestataire',
      preserveResponseData: true,
    });
  }
}

export const activitePrestataireService = {
  getActivitesPrestatairesBySejour,
  getActivitePrestataireById,
  modifierEnfantsActivitePrestataire,
  modifierActivitePrestataire,
};
