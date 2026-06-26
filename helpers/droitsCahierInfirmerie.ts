import type {
  CahierInfirmerieEntreeDto,
  DirecteurInfos,
  ProfilUtilisateurDTO,
} from '../types/api';

/**
 * Gestion complète du séjour : directeur du séjour, membre adjoint, ou admin plateforme.
 * Aligné sur `peutGererMembresEquipeSejour` + `aDroitGestionCompleteSurSejour` côté web.
 */
function aDroitGestionCompleteSurSejour(
  utilisateurTokenId: string | null | undefined,
  roleGlobal: string | null | undefined,
  directeur: DirecteurInfos | null | undefined,
  equipe: ProfilUtilisateurDTO[] | undefined,
): boolean {
  if (roleGlobal === 'ADMIN') return true;
  const tid = utilisateurTokenId?.trim();
  if (!tid) return false;
  if (directeur?.tokenId?.trim() === tid) return true;
  const membre = equipe?.find((m) => m.tokenId?.trim() === tid);
  return membre?.roleSejour === 'ADJOINT';
}

/** PUT : admin, gestion complète du séjour, auteur ou soigneur désigné. */
export function peutModifierEntreeCahierInfirmerie(
  entree: CahierInfirmerieEntreeDto,
  utilisateurTokenId: string | null | undefined,
  roleGlobal: string | null | undefined,
  directeur: DirecteurInfos | null | undefined,
  equipe: ProfilUtilisateurDTO[] | undefined,
): boolean {
  const tid = utilisateurTokenId?.trim();
  if (!tid) return false;
  if (roleGlobal === 'ADMIN') return true;
  if (aDroitGestionCompleteSurSejour(tid, roleGlobal, directeur, equipe)) return true;
  if (entree.createurTokenId?.trim() === tid) return true;
  if (entree.soigneurTokenId?.trim() === tid) return true;
  return false;
}

/** DELETE : même périmètre que la modification. */
export function peutSupprimerEntreeCahierInfirmerie(
  entree: CahierInfirmerieEntreeDto,
  utilisateurTokenId: string | null | undefined,
  roleGlobal: string | null | undefined,
  directeur: DirecteurInfos | null | undefined,
  equipe: ProfilUtilisateurDTO[] | undefined,
): boolean {
  return peutModifierEntreeCahierInfirmerie(entree, utilisateurTokenId, roleGlobal, directeur, equipe);
}
