import type {
  CahierInfirmerieEntreeDto,
  SaveCahierInfirmerieEntreeRequest,
} from '../types/api';
import { adaptAxiosError } from '../helpers/axiosError';
import Axios from './httpClient';

async function listerEntrees(sejourId: number): Promise<CahierInfirmerieEntreeDto[]> {
  try {
    const response = await Axios.get<CahierInfirmerieEntreeDto[]>(
      `/sejours/${sejourId}/cahier-infirmerie`,
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: "Erreur lors du chargement du cahier d'infirmerie",
      logContext: 'cahierInfirmerie listerEntrees',
    });
  }
}

async function creerEntree(
  sejourId: number,
  body: SaveCahierInfirmerieEntreeRequest,
): Promise<CahierInfirmerieEntreeDto> {
  try {
    const response = await Axios.post<CahierInfirmerieEntreeDto>(
      `/sejours/${sejourId}/cahier-infirmerie`,
      body,
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: "Erreur lors de la création de l'entrée",
      logContext: 'cahierInfirmerie creerEntree',
    });
  }
}

async function modifierEntree(
  sejourId: number,
  entreeId: number,
  body: SaveCahierInfirmerieEntreeRequest,
): Promise<CahierInfirmerieEntreeDto> {
  try {
    const response = await Axios.put<CahierInfirmerieEntreeDto>(
      `/sejours/${sejourId}/cahier-infirmerie/${entreeId}`,
      body,
    );
    return response.data;
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: "Erreur lors de la modification de l'entrée",
      logContext: 'cahierInfirmerie modifierEntree',
    });
  }
}

async function supprimerEntree(sejourId: number, entreeId: number): Promise<void> {
  try {
    await Axios.delete(`/sejours/${sejourId}/cahier-infirmerie/${entreeId}`);
  } catch (error: unknown) {
    adaptAxiosError(error, {
      defaultMessage: "Erreur lors de la suppression de l'entrée",
      logContext: 'cahierInfirmerie supprimerEntree',
    });
  }
}

export const cahierInfirmerieService = {
  listerEntrees,
  creerEntree,
  modifierEntree,
  supprimerEntree,
};
