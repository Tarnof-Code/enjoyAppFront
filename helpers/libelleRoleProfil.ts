import type { SejourDTO } from '../types/api';

function estFeminin(genre: string | null | undefined): boolean {
  const g = genre?.trim().toLowerCase() ?? '';
  return g === 'féminin' || g === 'feminin';
}

function libelleRoleSysteme(role: string | null | undefined, genre: string | null | undefined): string {
  const f = estFeminin(genre);
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'DIRECTION':
      return f ? 'Directrice' : 'Directeur';
    case 'BASIC_USER':
      return f ? 'Utilisatrice' : 'Utilisateur';
    default:
      return role ?? 'Utilisateur';
  }
}

function libelleRoleSejour(roleSejour: string, genre: string | null | undefined): string {
  const f = estFeminin(genre);
  switch (roleSejour) {
    case 'ANIM':
      return f ? 'Animatrice' : 'Animateur';
    case 'AS':
      return f ? 'Assistante sanitaire' : 'Assistant sanitaire';
    case 'ADJOINT':
      return f ? 'Adjointe' : 'Adjoint';
    case 'SB':
      return f ? 'Surveillante de baignade' : 'Surveillant de baignade';
    case 'AUTRE':
      return 'Autre';
    default:
      return roleSejour;
  }
}

/** Libellé de rôle affiché sur le profil (séjour courant ou rôle système). */
export function libelleRoleBadgeProfil(
  utilisateurTokenId: string | null | undefined,
  genre: string | null | undefined,
  roleSysteme: string | null | undefined,
  sejour: SejourDTO | null | undefined,
): string {
  const tid = utilisateurTokenId?.trim();
  if (tid && sejour?.directeur?.tokenId?.trim() === tid) {
    return libelleRoleSysteme('DIRECTION', genre);
  }
  const membre = sejour?.equipe?.find((m) => m.tokenId?.trim() === tid);
  if (membre?.roleSejour) {
    return libelleRoleSejour(String(membre.roleSejour), genre);
  }
  return libelleRoleSysteme(roleSysteme, genre);
}
