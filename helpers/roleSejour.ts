import type { RoleSejour } from '../types/api';

const LIBELLES_COURTS: Record<RoleSejour, string> = {
  ANIM: 'Anim',
  AS: 'AS',
  ADJOINT: 'Adj',
  SB: 'SB',
  AUTRE: 'Autre',
};

const LIBELLES_LONGS_MASCULIN: Record<RoleSejour, string> = {
  ANIM: 'Animateur',
  AS: 'Assistant sanitaire',
  ADJOINT: 'Adjoint',
  SB: 'Surveillant de baignade',
  AUTRE: 'Autre',
};

const LIBELLES_LONGS_FEMININ: Record<RoleSejour, string> = {
  ANIM: 'Animatrice',
  AS: 'Assistante sanitaire',
  ADJOINT: 'Adjointe',
  SB: 'Surveillante de baignade',
  AUTRE: 'Autre',
};

export const ROLES_SEJOUR: RoleSejour[] = ['AS', 'SB', 'ANIM', 'ADJOINT', 'AUTRE'];

function estFeminin(genre: string | null | undefined): boolean {
  return genre === 'Feminin' || genre === 'Féminin';
}

export function libelleRoleSejourCourt(role: string | null | undefined): string {
  if (role && role in LIBELLES_COURTS) return LIBELLES_COURTS[role as RoleSejour];
  return 'Autre';
}

export function libelleRoleSejour(
  role: string | null | undefined,
  genre?: string | null,
): string {
  const libelles = estFeminin(genre) ? LIBELLES_LONGS_FEMININ : LIBELLES_LONGS_MASCULIN;
  if (role && role in libelles) return libelles[role as RoleSejour];
  return 'Autre';
}
