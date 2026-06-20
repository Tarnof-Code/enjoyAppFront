import dayjs from 'dayjs';

import type { TypeRepas } from '../types/api';

export const ORDRE_REPAS: TypeRepas[] = ['PETIT_DEJEUNER', 'DEJEUNER', 'GOUTER', 'DINER'];

const TYPES_REPAS_SET = new Set<TypeRepas>(ORDRE_REPAS);

/**
 * Jour `YYYY-MM-DD` à partir d'une valeur `dateRepas` API : chaîne ISO,
 * timestamp ms, ou tableau Jackson `LocalDate` `[année, mois, jour]`.
 */
export function jourISOdepuisDateRepas(valeur: unknown): string {
  if (valeur == null) return '';
  if (typeof valeur === 'string') {
    const s = valeur.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (s.indexOf('T') === 10) return s.slice(0, 10);
    const d = dayjs(s);
    return d.isValid() ? d.format('YYYY-MM-DD') : '';
  }
  if (typeof valeur === 'number' && Number.isFinite(valeur)) {
    const d = dayjs(valeur);
    return d.isValid() ? d.format('YYYY-MM-DD') : '';
  }
  if (Array.isArray(valeur) && valeur.length >= 3) {
    const [annee, mois, jour] = valeur.map(Number);
    if ([annee, mois, jour].every((n) => Number.isFinite(n))) {
      return `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
    }
  }
  return '';
}

/** Normalise `typeRepas` (chaîne, casse/accents, ou enum JSON `{ name }`) en `TypeRepas`. */
export function typeRepasNormalise(valeur: unknown): TypeRepas | null {
  let brut: unknown = valeur;
  if (brut && typeof brut === 'object' && 'name' in (brut as object)) {
    brut = (brut as { name?: unknown }).name;
  }
  if (typeof brut !== 'string') return null;
  let s = brut
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (s === 'PETITDEJEUNER') s = 'PETIT_DEJEUNER';
  return TYPES_REPAS_SET.has(s as TypeRepas) ? (s as TypeRepas) : null;
}
