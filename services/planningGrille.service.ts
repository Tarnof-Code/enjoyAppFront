import type {
  ModifierMaPresenceCelluleMembreEquipeRequest,
  PlanningCelluleDto,
  PlanningGrilleDetailDto,
  PlanningGrilleSummaryDto,
  UpsertPlanningCellulesRequest,
} from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

export async function getPlanningGrillesBySejour(
  sejourId: number,
): Promise<PlanningGrilleSummaryDto[]> {
  try {
    const response = await Axios.get<PlanningGrilleSummaryDto[]>(
      `/sejours/${sejourId}/planning-grilles`,
    );
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement des plannings',
      logContext: 'planningGrille getPlanningGrillesBySejour',
    });
  }
}

export async function getPlanningGrilleById(
  sejourId: number,
  grilleId: number,
): Promise<PlanningGrilleDetailDto> {
  try {
    const response = await Axios.get<PlanningGrilleDetailDto>(
      `/sejours/${sejourId}/planning-grilles/${grilleId}`,
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Erreur lors du chargement du planning',
      logContext: 'planningGrille getPlanningGrilleById',
    });
  }
}

export async function remplacerCellulesPlanning(
  sejourId: number,
  grilleId: number,
  ligneId: number,
  body: UpsertPlanningCellulesRequest,
): Promise<PlanningCelluleDto[]> {
  try {
    const response = await Axios.put<PlanningCelluleDto[]>(
      `/sejours/${sejourId}/planning-grilles/${grilleId}/lignes/${ligneId}/cellules`,
      body,
    );
    return response.data ?? [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Impossible d\'enregistrer la cellule',
      logContext: 'planningGrille remplacerCellulesPlanning',
      preserveResponseData: true,
    });
  }
}

export async function modifierMaPresenceCellulePlanning(
  sejourId: number,
  grilleId: number,
  ligneId: number,
  jour: string,
  body: ModifierMaPresenceCelluleMembreEquipeRequest,
): Promise<PlanningCelluleDto | null> {
  try {
    const j = jour.trim();
    const response = await Axios.patch<PlanningCelluleDto>(
      `/sejours/${sejourId}/planning-grilles/${grilleId}/lignes/${ligneId}/cellules/${encodeURIComponent(j)}/ma-presence`,
      body,
    );
    if (response.status === 204) return null;
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: 'Impossible de mettre à jour votre inscription',
      logContext: 'planningGrille modifierMaPresenceCellulePlanning',
      preserveResponseData: true,
    });
  }
}

export const planningGrilleService = {
  getPlanningGrillesBySejour,
  getPlanningGrilleById,
  remplacerCellulesPlanning,
  modifierMaPresenceCellulePlanning,
};
