import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import type { ReunionDto } from '../types/api';

dayjs.locale('fr');

/** Date liste : « Vendredi 26 juin » */
export function formatDateReunionListe(dateIso: string): string {
  const d = dayjs(dateIso);
  const nomJour = d.format('dddd');
  const jour = nomJour.charAt(0).toUpperCase() + nomJour.slice(1);
  return `${jour} ${d.format('D')} ${d.format('MMMM')}`;
}

/** Titre accueil : « Réunion du Vendredi 26 juin » */
export function formatTitreCompteRenduAccueil(dateIso: string): string {
  return `Réunion du ${formatDateReunionListe(dateIso)}`;
}

/** Date la plus récente en premier ; à date égale : id décroissant. */
export function trierReunionsPlusRecentVersAncien(reunions: ReunionDto[]): ReunionDto[] {
  return [...reunions].sort((a, b) => {
    const cmp = b.date.trim().localeCompare(a.date.trim());
    if (cmp !== 0) return cmp;
    return b.id - a.id;
  });
}

/** Réunion la plus récente : date décroissante, puis id décroissant. */
export function trouverDerniereReunion(reunions: ReunionDto[]): ReunionDto | null {
  return trierReunionsPlusRecentVersAncien(reunions)[0] ?? null;
}
