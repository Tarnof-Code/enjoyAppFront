/**
 * Types API alignés sur enjoyWebApp/src/types/api.d.ts (sous-ensemble mobile v1).
 */

export type RoleSysteme = 'ADMIN' | 'DIRECTION' | 'BASIC_USER';

export interface SejourDTO {
  id: number;
  nom: string;
  description: string;
  dateDebut: string | number;
  dateFin: string | number;
  lieuDuSejour: string;
  directeur?: DirecteurInfos;
  equipe?: ProfilUtilisateurDTO[];
}

export interface DirecteurInfos {
  tokenId: string;
  nom: string;
  prenom: string;
}

export interface ProfilUtilisateurDTO {
  id: number;
  tokenId: string;
  role: RoleSysteme | string;
  nom: string;
  prenom: string;
  genre: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  dateExpirationCompte: string;
  photoProfilUrl?: string | null;
}

export interface AuthenticationResponse {
  role?: RoleSysteme;
  tokenId?: string;
  access_token?: string;
  refresh_token?: string;
  errorMessage?: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: RoleSysteme;
}

export type ReunionContenuTipTapJson = Record<string, unknown>;

export interface ReunionDto {
  id: number;
  sejourId: number;
  date: string;
  ordreDuJour: string | null;
  contenu: ReunionContenuTipTapJson;
}
