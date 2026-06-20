import dayjs from 'dayjs';

/**
 * Jour `YYYY-MM-DD` à partir d'une valeur de date API : chaîne ISO,
 * timestamp ms, ou tableau Jackson `LocalDate` `[année, mois, jour]`.
 */
export function jourISOdepuisValeurApi(valeur: unknown): string {
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
