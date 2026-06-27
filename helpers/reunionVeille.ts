import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import type { ReunionDto } from '../types/api';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('fr');

const FUSEAU_SEJOUR = 'Europe/Paris';

export function dateVeilleCalendaire(dateReference = dayjs()): string {
  return dateReference.tz(FUSEAU_SEJOUR).subtract(1, 'day').format('YYYY-MM-DD');
}

/** Titre accueil : « Réunion du Vendredi 26 juin » */
export function formatTitreCompteRenduAccueil(dateIso: string): string {
  const d = dayjs(dateIso);
  const nomJour = d.format('dddd');
  const jour = nomJour.charAt(0).toUpperCase() + nomJour.slice(1);
  return `Réunion du ${jour} ${d.format('D')} ${d.format('MMMM')}`;
}

/** Réunion du J−1 ; en cas d'égalité de date, la plus récente par `id`. */
export function trouverReunionVeille(
  reunions: ReunionDto[],
  dateReference?: dayjs.Dayjs,
): ReunionDto | null {
  const veille = dateVeilleCalendaire(dateReference);
  const candidates = reunions.filter((r) => r.date === veille);
  if (candidates.length === 0) return null;
  return candidates.reduce((best, current) => (current.id > best.id ? current : best));
}
