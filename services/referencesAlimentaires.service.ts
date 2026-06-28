import type { ReferenceAlimentaireDto, ReferenceAlimentaireType } from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export function trierReferencesAlimentaires(refs: ReferenceAlimentaireDto[]): ReferenceAlimentaireDto[] {
  return [...refs].sort((a, b) => a.ordre - b.ordre || a.id - b.id);
}

export async function getReferencesAlimentaires(
  type?: ReferenceAlimentaireType,
): Promise<ReferenceAlimentaireDto[]> {
  try {
    const response = await Axios.get<ReferenceAlimentaireDto[]>('/references-alimentaires', {
      params: type ? { type } : undefined,
    });
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des références alimentaires',
      logContext: 'referencesAlimentaires getReferencesAlimentaires',
    });
  }
}

export const referencesAlimentairesService = {
  getReferencesAlimentaires,
  trierReferencesAlimentaires,
};
