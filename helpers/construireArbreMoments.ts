import type { MomentDto } from '../types/api';

export interface MomentArbreNode extends MomentDto {
  enfants: MomentArbreNode[];
}

export type MomentAplat = MomentDto & { profondeur: number };

function trierMomentsParOrdre(a: MomentDto, b: MomentDto): number {
  const oa = a.ordre ?? a.id;
  const ob = b.ordre ?? b.id;
  if (oa !== ob) return oa - ob;
  return a.id - b.id;
}

export function construireArbreMoments(moments: MomentDto[]): MomentArbreNode[] {
  const parId = new Map<number, MomentArbreNode>(
    moments.map((m) => [m.id, { ...m, enfants: [] }]),
  );
  const racines: MomentArbreNode[] = [];
  for (const m of parId.values()) {
    if (m.parentId == null) {
      racines.push(m);
    } else {
      const parent = parId.get(m.parentId);
      if (parent) {
        parent.enfants.push(m);
      } else {
        racines.push(m);
      }
    }
  }
  const triParOrdre = (list: MomentArbreNode[]) => {
    list.sort(trierMomentsParOrdre);
    list.forEach((n) => triParOrdre(n.enfants));
  };
  triParOrdre(racines);
  return racines;
}

/** Parcours profondeur d'abord : ordre d'affichage hiérarchique. */
export function aplatirMomentsHierarchiquement(moments: MomentDto[]): MomentAplat[] {
  const racines = construireArbreMoments(moments);
  const result: MomentAplat[] = [];
  const walk = (nodes: MomentArbreNode[], profondeur: number) => {
    for (const { enfants, ...m } of nodes) {
      result.push({ ...m, profondeur });
      walk(enfants, profondeur + 1);
    }
  };
  walk(racines, 0);
  return result;
}

/** Ids du sous-arbre (nœud + descendants). */
export function idsSousArbreMoment(moments: readonly MomentDto[], racineId: number): number[] {
  const ids = [racineId];
  const enfants = moments.filter((m) => m.parentId === racineId).sort(trierMomentsParOrdre);
  for (const e of enfants) {
    ids.push(...idsSousArbreMoment(moments, e.id));
  }
  return ids;
}

/** Ancêtres directs et indirects d'un moment (ids des parents remontés). */
export function ancetresMomentIds(moments: readonly MomentDto[], momentId: number): number[] {
  const ids: number[] = [];
  let courant = moments.find((m) => m.id === momentId);
  while (courant?.parentId != null) {
    ids.push(courant.parentId);
    courant = moments.find((m) => m.id === courant!.parentId);
  }
  return ids;
}

/** Moment + ancêtres + descendants (créneaux qui se chevauchent). */
export function idsEnConflit(momentId: number, moments: readonly MomentDto[]): Set<number> {
  const ids = new Set<number>();
  for (const id of idsSousArbreMoment(moments, momentId)) ids.add(id);
  for (const id of ancetresMomentIds(moments, momentId)) ids.add(id);
  return ids;
}

/** Moments à afficher comme sélectionnés quand `momentSelectionneId` est choisi (parent + descendants). */
export function idsMomentsSelectionVisuelle(
  moments: readonly MomentDto[],
  momentSelectionneId: number | '',
): Set<number> {
  if (momentSelectionneId === '') return new Set();
  return new Set(idsSousArbreMoment(moments, momentSelectionneId));
}

/** Indentation horizontale d’un moment selon sa profondeur (aligné web `blocEnfants`). */
export const PAS_INDENT_MOMENT = 16;

export function margeGaucheMoment(profondeur: number): number {
  return Math.max(0, profondeur) * PAS_INDENT_MOMENT;
}

/** Décalage + bordure gauche accentuée pour les sous-moments (web : `blocEnfants`). */
export function styleIndentMoment(profondeur: number): {
  marginLeft?: number;
  borderLeftWidth?: number;
  borderLeftColor?: string;
  paddingLeft?: number;
} {
  if (profondeur <= 0) return {};
  return {
    marginLeft: margeGaucheMoment(profondeur),
    borderLeftWidth: 3,
    borderLeftColor: '#b8d4e8',
    paddingLeft: 10,
  };
}

/** Indentation textuelle pour libellés (select natif web). */
export function libelleMomentIndente(moment: Pick<MomentAplat, 'nom' | 'profondeur'>): string {
  if (moment.profondeur <= 0) return moment.nom;
  return `${'\u00a0\u00a0'.repeat(moment.profondeur)}${moment.nom}`;
}

/**
 * Retire les moments ancêtres lorsqu'un descendant est aussi sélectionné
 * (évite parent + sous-moment sur une même sortie).
 */
export function elaguerSelectionMomentsSansChevauchementHierarchique(
  moments: readonly MomentDto[],
  ids: Iterable<number>,
): number[] {
  const set = new Set(ids);
  for (const id of [...set]) {
    for (const descendant of idsSousArbreMoment(moments, id)) {
      if (descendant !== id && set.has(descendant)) {
        set.delete(id);
        break;
      }
    }
  }
  return [...set];
}

/** Message d'erreur si la sélection mélange moment parent et sous-moment. */
export function messageErreurSelectionMomentsChevauchementHierarchique(
  moments: readonly MomentDto[],
  ids: Iterable<number>,
): string | null {
  const arr = [...ids];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i];
      const b = arr[j];
      if (!idsEnConflit(a, moments).has(b)) continue;
      const nomA = moments.find((m) => m.id === a)?.nom.trim() || String(a);
      const nomB = moments.find((m) => m.id === b)?.nom.trim() || String(b);
      return `Les moments « ${nomA} » et « ${nomB} » ne peuvent pas être sélectionnés ensemble (moment et sous-moment).`;
    }
  }
  return null;
}
