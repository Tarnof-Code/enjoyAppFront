import type { PlanningGrilleDetailDto, PlanningGrilleSummaryDto } from '../types/api';
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

export const planningGrilleService = {
  getPlanningGrillesBySejour,
  getPlanningGrilleById,
};
