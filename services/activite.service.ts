import type { ActiviteDto, CreateActiviteRequest, UpdateActiviteRequest } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getActivitesBySejour(sejourId: number): Promise<ActiviteDto[]> {
  try {
    const response = await Axios.get<ActiviteDto[]>(`/sejours/${sejourId}/activites`);
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des activités',
      logContext: 'activite getActivitesBySejour',
    });
  }
}

export async function getActiviteById(sejourId: number, activiteId: number): Promise<ActiviteDto> {
  try {
    const response = await Axios.get<ActiviteDto>(`/sejours/${sejourId}/activites/${activiteId}`);
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement de l’activité',
      logContext: 'activite getActiviteById',
    });
  }
}

export async function creerActivite(
  sejourId: number,
  request: CreateActiviteRequest,
): Promise<ActiviteDto> {
  try {
    const response = await Axios.post<ActiviteDto>(`/sejours/${sejourId}/activites`, request);
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors de la création de l’activité',
      logContext: 'activite creerActivite',
    });
  }
}

export async function modifierActivite(
  sejourId: number,
  activiteId: number,
  request: UpdateActiviteRequest,
): Promise<ActiviteDto> {
  try {
    const response = await Axios.put<ActiviteDto>(
      `/sejours/${sejourId}/activites/${activiteId}`,
      request,
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors de la modification de l’activité',
      logContext: 'activite modifierActivite',
    });
  }
}

export async function supprimerActivite(sejourId: number, activiteId: number): Promise<void> {
  try {
    await Axios.delete(`/sejours/${sejourId}/activites/${activiteId}`);
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors de la suppression de l’activité',
      logContext: 'activite supprimerActivite',
    });
  }
}

export const activiteService = {
  getActivitesBySejour,
  getActiviteById,
  creerActivite,
  modifierActivite,
  supprimerActivite,
};
