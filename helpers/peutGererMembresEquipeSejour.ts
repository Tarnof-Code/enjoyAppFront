import type { DirecteurInfos, ProfilUtilisateurDTO } from '../types/api';

/** Directeur du séjour ou adjoint : gestion complète des cellules de planning. */
export function peutGererMembresEquipeSejour(
  utilisateurTokenId: string | null | undefined,
  directeur: DirecteurInfos | null | undefined,
  equipe: ProfilUtilisateurDTO[] | undefined,
): boolean {
  const tid = utilisateurTokenId?.trim();
  if (!tid) return false;
  if (directeur?.tokenId?.trim() === tid) return true;
  const membre = equipe?.find((m) => m.tokenId?.trim() === tid);
  return membre?.roleSejour === 'ADJOINT';
}
