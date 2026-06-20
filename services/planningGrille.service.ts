import type { PlanningGrilleSummaryDto } from '../types/api';
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

export const planningGrilleService = {
  getPlanningGrillesBySejour,
};
