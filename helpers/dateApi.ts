import dayjs, { type Dayjs } from 'dayjs';

/**
 * Parse une valeur date/heure API : ISO 8601, epoch secondes ou millisecondes.
 * Aligné sur enjoyWebApp/helpers/formaterDate.ts (`parseDate`).
 */
export function parseDateDepuisValeurApi(
  valeur: string | Date | number | null | undefined,
): Date | null {
  if (valeur == null) return null;
  if (valeur instanceof Date) {
    return Number.isNaN(valeur.getTime()) ? null : valeur;
  }
  if (typeof valeur === 'number' && Number.isFinite(valeur)) {
    const ms = valeur < 10_000_000_000 ? valeur * 1000 : valeur;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof valeur === 'string') {
    const s = valeur.trim();
    if (s === '') return null;
    if (/^\d+$/.test(s)) {
      const n = Number(s);
      if (!Number.isFinite(n)) return null;
      const ms = n < 10_000_000_000 ? n * 1000 : n;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function dayjsDepuisValeurApi(
  valeur: string | Date | number | null | undefined,
): Dayjs {
  const d = parseDateDepuisValeurApi(valeur);
  return d ? dayjs(d) : dayjs(Number.NaN);
}

/**
 * Jour `YYYY-MM-DD` à partir d'une valeur de date API : chaîne ISO,
 * timestamp s/ms, ou tableau Jackson `LocalDate` `[année, mois, jour]`.
 */
export function jourISOdepuisValeurApi(valeur: unknown): string {
  if (valeur == null) return '';
  if (typeof valeur === 'string') {
    const s = valeur.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (s.indexOf('T') === 10) return s.slice(0, 10);
    const d = dayjsDepuisValeurApi(s);
    return d.isValid() ? d.format('YYYY-MM-DD') : '';
  }
  if (typeof valeur === 'number' && Number.isFinite(valeur)) {
    const d = dayjsDepuisValeurApi(valeur);
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
