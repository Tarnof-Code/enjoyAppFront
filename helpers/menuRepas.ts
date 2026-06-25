import type { MenuRepasDto, TypeRepas } from '../types/api';
import { jourISOdepuisValeurApi } from './dateApi';

export const ORDRE_REPAS: TypeRepas[] = ['PETIT_DEJEUNER', 'DEJEUNER', 'GOUTER', 'DINER'];

const TYPES_REPAS_SET = new Set<TypeRepas>(ORDRE_REPAS);

export const LABELS_TYPE_REPAS: Record<TypeRepas, string> = {
  PETIT_DEJEUNER: 'Petit-déjeuner',
  DEJEUNER: 'Déjeuner',
  GOUTER: 'Goûter',
  DINER: 'Dîner',
};

export const COULEUR_FOND_CARTE_MENU: Record<TypeRepas, string> = {
  PETIT_DEJEUNER: '#fff0cc',
  DEJEUNER: '#d4f0e4',
  GOUTER: '#ffe4d4',
  DINER: '#dde4f7',
};

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

export function estPetitDejeunerOuGouter(type: TypeRepas): boolean {
  return type === 'PETIT_DEJEUNER' || type === 'GOUTER';
}

export function indexerMenusParJourEtType(
  menus: MenuRepasDto[],
): Map<string, Map<TypeRepas, MenuRepasDto>> {
  const parJour = new Map<string, Map<TypeRepas, MenuRepasDto>>();
  for (const menu of menus) {
    const jour = jourISOdepuisDateRepas(menu.dateRepas as unknown);
    const type = typeRepasNormalise(menu.typeRepas as unknown);
    if (!jour || !type) continue;
    const repasDuJour = parJour.get(jour) ?? new Map<TypeRepas, MenuRepasDto>();
    repasDuJour.set(type, { ...menu, dateRepas: jour, typeRepas: type });
    parJour.set(jour, repasDuJour);
  }
  return parJour;
}

function lignesCompositionMenu(menu: MenuRepasDto): string[] {
  if (estPetitDejeunerOuGouter(menu.typeRepas)) {
    return [menu.detailPetitDejeunerOuGouter].filter((v): v is string => !!v?.trim());
  }
  return [menu.entree, menu.plat, menu.fromageOuEntremet, menu.dessert].filter(
    (v): v is string => !!v?.trim(),
  );
}

export function menuCelluleEstVide(menu: MenuRepasDto | undefined): boolean {
  if (!menu) return true;
  return lignesCompositionMenu(menu).length === 0;
}

/** Résumé court pour une cellule de la grille calendrier. */
export function resumeMenuCellule(menu: MenuRepasDto | undefined): string {
  if (!menu) return '—';
  const lignes = lignesCompositionMenu(menu);
  if (lignes.length === 0) return '—';
  return lignes.join('\n');
}

export function metaAllergenesRegimesMenu(menu: MenuRepasDto | undefined, max = 72): string {
  if (!menu) return '';
  const libs = [
    ...(menu.allergenes ?? []).map((a) => a.libelle.trim()),
    ...(menu.regimesEtPreferences ?? []).map((r) => r.libelle.trim()),
  ].filter(Boolean);
  if (libs.length === 0) return '';
  const texte = libs.join(' - ');
  return texte.length > max ? `${texte.slice(0, max - 1)}…` : texte;
}

export function compterRepasRenseignes(repasDuJour: Map<TypeRepas, MenuRepasDto> | undefined): number {
  if (!repasDuJour) return 0;
  return ORDRE_REPAS.filter((type) => !menuCelluleEstVide(repasDuJour.get(type))).length;
}

/** Jour par défaut à l'ouverture : aujourd'hui si dans le séjour, sinon le premier jour. */
export function jourFocusDefautMenus(jours: string[], aujourdhuiYmd: string): string {
  if (jours.length === 0) return '';
  if (jours.includes(aujourdhuiYmd)) return aujourdhuiYmd;
  return jours[0];
}
