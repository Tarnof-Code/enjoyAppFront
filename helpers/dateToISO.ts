import { parseDateDepuisValeurApi } from './dateApi';

/** Convertit une date en string ISO 8601 pour l'API. */
export function dateToISO(date: string | Date | number | undefined | null): string | undefined {
  const parsed = parseDateDepuisValeurApi(date ?? null);
  if (!parsed) return undefined;
  return parsed.toISOString();
}
