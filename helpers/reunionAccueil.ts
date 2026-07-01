import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import type { ReunionDto } from '../types/api';

dayjs.locale('fr');

/** Titre accueil : « Réunion du Vendredi 26 juin » */
export function formatTitreCompteRenduAccueil(dateIso: string): string {
  const d = dayjs(dateIso);
  const nomJour = d.format('dddd');
  const jour = nomJour.charAt(0).toUpperCase() + nomJour.slice(1);
  return `Réunion du ${jour} ${d.format('D')} ${d.format('MMMM')}`;
}

/** Réunion la plus récente : date décroissante, puis id décroissant. */
export function trouverDerniereReunion(reunions: ReunionDto[]): ReunionDto | null {
  if (reunions.length === 0) return null;
  return [...reunions].sort((a, b) => {
    const cmp = b.date.trim().localeCompare(a.date.trim());
    if (cmp !== 0) return cmp;
    return b.id - a.id;
  })[0]!;
}
