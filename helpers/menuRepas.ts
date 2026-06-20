import type { TypeRepas } from '../types/api';
import { jourISOdepuisValeurApi } from './dateApi';

export const ORDRE_REPAS: TypeRepas[] = ['PETIT_DEJEUNER', 'DEJEUNER', 'GOUTER', 'DINER'];

const TYPES_REPAS_SET = new Set<TypeRepas>(ORDRE_REPAS);

/** Jour `YYYY-MM-DD` à partir d'une valeur `dateRepas` API. */
export const jourISOdepuisDateRepas = jourISOdepuisValeurApi;

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
