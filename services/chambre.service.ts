import type {
  AffecterOccupantChambreRequest,
  AffecterOccupantsEnfantsRequest,
  AffecterOccupantsEquipeRequest,
  ChambreDto,
  SaveChambreRequest,
} from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getChambresBySejour(sejourId: number): Promise<ChambreDto[]> {
  try {
    const response = await Axios.get<ChambreDto[]>(`/sejours/${sejourId}/chambres`);
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des chambres',
      logContext: 'chambre getChambresBySejour',
    });
  }
}

export async function getChambreById(sejourId: number, chambreId: number): Promise<ChambreDto> {
  try {
    const response = await Axios.get<ChambreDto>(`/sejours/${sejourId}/chambres/${chambreId}`);
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement de la chambre',
      logContext: 'chambre getChambreById',
    });
  }
}

export async function creerChambre(sejourId: number, request: SaveChambreRequest): Promise<ChambreDto> {
  try {
    const response = await Axios.post<ChambreDto>(`/sejours/${sejourId}/chambres`, request);
    if (response.status !== 201) {
      throw new Error('Erreur lors de la création de la chambre');
    }
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors de la création de la chambre',
      logContext: 'chambre creerChambre',
    });
  }
}

export async function modifierChambre(
  sejourId: number,
  chambreId: number,
  request: SaveChambreRequest,
): Promise<ChambreDto> {
  try {
    const response = await Axios.put<ChambreDto>(`/sejours/${sejourId}/chambres/${chambreId}`, request);
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors de la modification de la chambre',
      logContext: 'chambre modifierChambre',
    });
  }
}

export async function supprimerChambre(sejourId: number, chambreId: number): Promise<void> {
  try {
    const response = await Axios.delete(`/sejours/${sejourId}/chambres/${chambreId}`);
    if (response.status !== 204) {
      throw new Error('Erreur lors de la suppression de la chambre');
    }
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors de la suppression de la chambre',
      logContext: 'chambre supprimerChambre',
    });
  }
}

export async function affecterEnfant(
  sejourId: number,
  chambreId: number,
  enfantId: number,
  request?: AffecterOccupantChambreRequest | null,
): Promise<ChambreDto> {
  try {
    const response = await Axios.post<ChambreDto>(
      `/sejours/${sejourId}/chambres/${chambreId}/occupants/enfants/${enfantId}`,
      request?.numeroLit != null ? request : undefined,
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: "Erreur lors de l'affectation de l'enfant à la chambre",
      logContext: 'chambre affecterEnfant',
    });
  }
}

export async function affecterEnfants(
  sejourId: number,
  chambreId: number,
  request: AffecterOccupantsEnfantsRequest,
): Promise<ChambreDto> {
  try {
    const response = await Axios.post<ChambreDto>(
      `/sejours/${sejourId}/chambres/${chambreId}/occupants/enfants`,
      request,
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: "Erreur lors de l'affectation des enfants à la chambre",
      logContext: 'chambre affecterEnfants',
    });
  }
}

export async function retirerEnfant(sejourId: number, chambreId: number, enfantId: number): Promise<void> {
  try {
    const response = await Axios.delete(
      `/sejours/${sejourId}/chambres/${chambreId}/occupants/enfants/${enfantId}`,
    );
    if (response.status !== 204) {
      throw new Error("Erreur lors du retrait de l'enfant de la chambre");
    }
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: "Erreur lors du retrait de l'enfant de la chambre",
      logContext: 'chambre retirerEnfant',
    });
  }
}

export async function affecterMembreEquipe(
  sejourId: number,
  chambreId: number,
  membreTokenId: string,
  request?: AffecterOccupantChambreRequest | null,
): Promise<ChambreDto> {
  try {
    const response = await Axios.post<ChambreDto>(
      `/sejours/${sejourId}/chambres/${chambreId}/occupants/equipe/${membreTokenId}`,
      request?.numeroLit != null ? request : undefined,
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: "Erreur lors de l'affectation du membre à la chambre",
      logContext: 'chambre affecterMembreEquipe',
    });
  }
}

export async function affecterMembresEquipe(
  sejourId: number,
  chambreId: number,
  request: AffecterOccupantsEquipeRequest,
): Promise<ChambreDto> {
  try {
    const response = await Axios.post<ChambreDto>(
      `/sejours/${sejourId}/chambres/${chambreId}/occupants/equipe`,
      request,
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: "Erreur lors de l'affectation des membres à la chambre",
      logContext: 'chambre affecterMembresEquipe',
    });
  }
}

export async function retirerMembreEquipe(
  sejourId: number,
  chambreId: number,
  membreTokenId: string,
): Promise<void> {
  try {
    const response = await Axios.delete(
      `/sejours/${sejourId}/chambres/${chambreId}/occupants/equipe/${membreTokenId}`,
    );
    if (response.status !== 204) {
      throw new Error('Erreur lors du retrait du membre de la chambre');
    }
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du retrait du membre de la chambre',
      logContext: 'chambre retirerMembreEquipe',
    });
  }
}

export const chambreService = {
  getChambresBySejour,
  getChambreById,
  creerChambre,
  modifierChambre,
  supprimerChambre,
  affecterEnfant,
  affecterEnfants,
  retirerEnfant,
  affecterMembreEquipe,
  affecterMembresEquipe,
  retirerMembreEquipe,
};
