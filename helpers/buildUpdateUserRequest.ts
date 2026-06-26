import type { RoleSysteme, UpdateUserRequest } from '../types/api';
import { dateToISO } from './dateToISO';

export interface BuildUpdateUserRequestParams {
  tokenId: string;
  prenom: string;
  nom: string;
  genre: string;
  email: string;
  telephone: string;
  dateNaissance: string | Date | number | undefined | null;
  isAdmin?: boolean;
  role?: RoleSysteme | string | null;
  dateExpirationCompte?: string | Date | number | undefined | null;
}

/** Construit le body PUT /utilisateurs (objet complet, role/dateExpiration null hors admin). */
export function buildUpdateUserRequest(params: BuildUpdateUserRequestParams): UpdateUserRequest {
  const base: UpdateUserRequest = {
    tokenId: params.tokenId,
    prenom: params.prenom,
    nom: params.nom,
    genre: params.genre,
    email: params.email,
    telephone: params.telephone,
    dateNaissance: dateToISO(params.dateNaissance) ?? '',
  };

  if (params.isAdmin) {
    return {
      ...base,
      role: (params.role as RoleSysteme) ?? undefined,
      dateExpirationCompte: dateToISO(params.dateExpirationCompte),
    };
  }

  return {
    ...base,
    role: null,
    dateExpirationCompte: null,
  };
}
