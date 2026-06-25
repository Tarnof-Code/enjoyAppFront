/**
 * Types API alignés sur enjoyWebApp/src/types/api.d.ts (sous-ensemble mobile v1).
 */

export type RoleSysteme = 'ADMIN' | 'DIRECTION' | 'BASIC_USER';

export type RoleSejour = 'ANIM' | 'AS' | 'ADJOINT' | 'SB' | 'AUTRE';

/** Critère de tri des listes de personnes côté API (miroir de l'enum Java CritereTriListe). */
export type CritereTriListeApi = 'NOM' | 'PRENOM';

export interface SejourDTO {
  id: number;
  nom: string;
  description: string;
  dateDebut: string | number;
  dateFin: string | number;
  lieuDuSejour: string;
  /** Ordre d'affichage des listes d'enfants (réglage partagé, lecture seule côté mobile). */
  triListesEnfants?: CritereTriListeApi;
  /** Ordre d'affichage des listes d'équipe (réglage partagé, lecture seule côté mobile). */
  triListesEquipe?: CritereTriListeApi;
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
  roleSejour?: RoleSejour | string;
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

export type TypeChambre = 'ENFANT' | 'EQUIPE';

export type GenreChambre = 'MASCULIN' | 'FEMININ' | 'MIXTE';

export interface GroupeResumeDto {
  id: number;
  libelle: string;
}

export interface ChambreReferentInfos {
  tokenId: string;
  nom: string;
  prenom: string;
}

export interface ChambreOccupantDto {
  id: number;
  typeOccupant: TypeChambre;
  enfantId: number | null;
  membreTokenId: string | null;
  nom: string;
  prenom: string;
  numeroLit: number | null;
}

export interface ChambreDto {
  id: number;
  sejourId: number;
  typeChambre: TypeChambre;
  identifiant: string;
  nom: string | null;
  capaciteMax: number;
  genreAutorise: GenreChambre;
  description: string | null;
  batiment: string | null;
  couloir: string | null;
  etage: number | null;
  groupe: GroupeResumeDto | null;
  referents: ChambreReferentInfos[];
  occupants: ChambreOccupantDto[];
}

/** Correspond à SaveChambreRequest.java (création et mise à jour). */
export interface SaveChambreRequest {
  typeChambre: TypeChambre;
  identifiant: string;
  nom?: string | null;
  capaciteMax: number;
  genreAutorise: GenreChambre;
  description?: string | null;
  batiment?: string | null;
  couloir?: string | null;
  etage?: number | null;
  /** ENFANT uniquement ; null = pas de restriction par groupe. */
  groupeId?: number | null;
}

export interface AffecterOccupantChambreRequest {
  numeroLit?: number | null;
}

export interface AffecterOccupantEnfantItemRequest {
  enfantId: number;
  numeroLit?: number | null;
}

export interface AffecterOccupantsEnfantsRequest {
  occupants: AffecterOccupantEnfantItemRequest[];
}

export interface AffecterOccupantEquipeItemRequest {
  membreTokenId: string;
  numeroLit?: number | null;
}

export interface AffecterOccupantsEquipeRequest {
  occupants: AffecterOccupantEquipeItemRequest[];
}

export type TypeGroupe = 'THEMATIQUE' | 'AGE' | 'NIVEAU_SCOLAIRE';

export interface ReferentInfos {
  tokenId: string;
  nom: string;
  prenom: string;
}

export interface EnfantDto {
  id: number;
  nom: string;
  prenom: string;
  genre: string;
  dateNaissance: string;
  niveauScolaire: string;
}

export interface GroupeDto {
  id: number;
  nom: string;
  description: string | null;
  typeGroupe: TypeGroupe;
  ageMin: number | null;
  ageMax: number | null;
  niveauScolaireMin: string | null;
  niveauScolaireMax: string | null;
  sejourId: number;
  enfants: EnfantDto[];
  referents: ReferentInfos[];
}

export type ReferenceAlimentaireType = 'ALLERGENE' | 'REGIME_PREFERENCE';

export interface ReferenceAlimentaireDto {
  id: number;
  type: ReferenceAlimentaireType;
  libelle: string;
  ordre: number;
  actif: boolean;
}

export interface PlanningGrilleSummaryDto {
  id: number;
  sejourId: number;
  titre: string;
  miseAJour: string;
}

export interface MomentDto {
  id: number;
  nom: string;
  sejourId: number;
  ordre: number;
  parentId: number | null;
}

export interface HoraireDto {
  id: number;
  libelle: string;
  sejourId: number;
}

export type EmplacementLieu = 'INTERIEUR' | 'EXTERIEUR' | 'HORS_CENTRE';

export type UsageLieu = 'ACTIVITE' | 'SURVEILLANCE' | 'RASSEMBLEMENT';

export interface LieuDto {
  id: number;
  nom: string;
  emplacement: EmplacementLieu;
  nombreMax: number | null;
  sejourId: number;
  partageableEntreAnimateurs: boolean;
  nombreMaxActivitesSimultanees: number | null;
  usages: UsageLieu[];
}

export type PlanningLigneLibelleSource =
  | 'SAISIE_LIBRE'
  | 'HORAIRE'
  | 'MOMENT'
  | 'GROUPE'
  | 'LIEU'
  | 'MEMBRE_EQUIPE';

export interface PlanningCelluleDto {
  id: number;
  jour: string;
  membreTokenIds?: string[] | null;
  horaireIds?: number[] | null;
  horaireLibelles?: string[] | null;
  momentIds?: number[] | null;
  groupeIds?: number[] | null;
  lieuIds?: number[] | null;
  texteLibre?: string | null;
}

export interface PlanningLigneDto {
  id: number;
  ordre: number;
  libelleSaisieLibre: string | null;
  libelleRegroupement: string | null;
  libelleMomentId: number | null;
  libelleHoraireId: number | null;
  libelleGroupeId: number | null;
  libelleLieuId: number | null;
  libelleUtilisateurTokenId: string | null;
  cellules: PlanningCelluleDto[];
}

export interface PlanningGrilleDetailDto {
  id: number;
  sejourId: number;
  titre: string;
  consigneGlobale: string | null;
  sourceLibelleLignes: PlanningLigneLibelleSource | null;
  sourceContenuCellules: PlanningLigneLibelleSource;
  miseAJour: string;
  lignes: PlanningLigneDto[];
}

export interface PlanningCellulePayload {
  jour: string;
  membreTokenIds?: string[] | null;
  horaireIds?: number[] | null;
  texteLibre?: string | null;
  momentIds?: number[] | null;
  groupeIds?: number[] | null;
  lieuIds?: number[] | null;
}

export interface UpsertPlanningCellulesRequest {
  cellules: PlanningCellulePayload[];
}

export interface ModifierMaPresenceCelluleMembreEquipeRequest {
  present: boolean;
}

export interface TypeActiviteDto {
  id: number;
  libelle: string;
  predefini: boolean;
  sejourId: number;
}

export interface ActiviteMembreEquipeInfo {
  tokenId: string;
  nom: string;
  prenom: string;
}

export interface EnfantParticipantInfo {
  id: number;
  nom: string;
  prenom: string;
}

export interface ActiviteDto {
  id: number;
  date: string;
  nom: string;
  description: string | null;
  sejourId: number;
  moment: MomentDto;
  typeActivite: TypeActiviteDto;
  membres: ActiviteMembreEquipeInfo[];
  groupeIds: number[];
  lieu: LieuDto | null;
  avertissementLieu?: string | null;
  enfants?: EnfantParticipantInfo[];
}

export interface CreateActiviteRequest {
  date: string;
  nom: string;
  description?: string | null;
  membreTokenIds: string[];
  groupeIds: number[];
  lieuId?: number | null;
  momentId?: number | null;
  typeActiviteId: number;
  enfantIds?: number[];
}

export interface UpdateActiviteRequest {
  date: string;
  nom: string;
  description?: string | null;
  membreTokenIds: string[];
  groupeIds: number[];
  lieuId?: number | null;
  momentId?: number | null;
  typeActiviteId: number;
  enfantIds?: number[];
}

export interface NonParticipationPrestataireDto {
  tokenId: string;
  momentId: number;
}

export interface ActivitePrestataireDto {
  id: number;
  nom: string;
  date: string | readonly number[];
  moments: MomentDto[];
  sejourId: number;
  heureDepart: string | null;
  heureRetour: string | null;
  informations: string | null;
  telephone: string | null;
  groupeIds: number[];
  nonParticipations: NonParticipationPrestataireDto[];
}

export interface SaveActivitePrestataireRequest {
  nom: string;
  date: string;
  momentIds: number[];
  heureDepart?: string | null;
  heureRetour?: string | null;
  informations?: string | null;
  telephone?: string | null;
  groupeIds?: number[];
  nonParticipations?: NonParticipationPrestataireDto[];
}

export interface DossierEnfantDto {
  id: number;
  enfantId: number;
  emailParent1: string | null;
  telephoneParent1: string | null;
  emailParent2: string | null;
  telephoneParent2: string | null;
  informationsMedicales: string | null;
  pai: string | null;
  allergenes: ReferenceAlimentaireDto[];
  regimesEtPreferences: ReferenceAlimentaireDto[];
  informationsAlimentaires: string | null;
  traitementMatin: string | null;
  traitementMidi: string | null;
  traitementSoir: string | null;
  traitementSiBesoin: string | null;
  autresInformations: string | null;
  aPrendreEnSortie: string | null;
}

export interface EnfantDossierSanitaireLigneDto {
  enfantId: number;
  prenom: string;
  nom: string;
  groupes: GroupeResumeDto[];
  dossier: DossierEnfantDto | null;
}

export type TypeRepas = 'PETIT_DEJEUNER' | 'DEJEUNER' | 'GOUTER' | 'DINER';

export interface MenuRepasDto {
  id: number;
  sejourId?: number;
  dateRepas: string;
  typeRepas: TypeRepas;
  detailPetitDejeunerOuGouter: string | null;
  entree: string | null;
  plat: string | null;
  fromageOuEntremet: string | null;
  dessert: string | null;
  allergenes?: ReferenceAlimentaireDto[];
  regimesEtPreferences?: ReferenceAlimentaireDto[];
}
