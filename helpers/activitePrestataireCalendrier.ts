import type {
  ActiviteDto,
  ActivitePrestataireDto,
  GroupeDto,
  MomentDto,
  NonParticipationPrestataireDto,
  SaveActivitePrestataireRequest,
} from '../types/api';
import { jourISOdepuisValeurApi } from './dateApi';
import { aplatirMomentsHierarchiquement, elaguerSelectionMomentsSansChevauchementHierarchique, idsEnConflit, idsSousArbreMoment } from './construireArbreMoments';
import { jourActivite } from './activiteUtils';

export type ChoixResolutionConflitPrestataire = 'sortie' | 'activite';

export type ConflitActiviteAvecSortie = {
  tokenId: string;
  animateurNom: string;
  animateurPrenom: string;
  momentId: number;
  momentNom: string;
  sortieId: number;
  sortieNom: string;
  sortieMomentIds: number[];
};

export type EntreeSortieCalendrier = {
  sortie: ActivitePrestataireDto;
  moment: MomentDto;
};

export type CalendrierCelluleItem =
  | { kind: 'activite'; activite: ActiviteDto; ordreMoment: number }
  | { kind: 'prestataire'; sortie: ActivitePrestataireDto; moment: MomentDto; ordreMoment: number }
  | {
      kind: 'conflit';
      sortie: ActivitePrestataireDto;
      moment: MomentDto;
      activite: ActiviteDto;
      ordreMoment: number;
    };

export const COULEUR_FOND_CARTE_SORTIE = 'rgba(13, 110, 92, 0.14)';

export function libellePlageHorairePrestataire(
  depart: string | null,
  retour: string | null,
): string | null {
  const d = (depart ?? '').trim();
  const r = (retour ?? '').trim();
  if (d && r) return `${d} – ${r}`;
  if (d) return `Départ ${d}`;
  if (r) return `Retour ${r}`;
  return null;
}

export function datePrestataireVersYmd(date: ActivitePrestataireDto['date']): string {
  return jourISOdepuisValeurApi(date) ?? '';
}

export function tokensReferentsConcernesParGroupeIds(
  groupes: GroupeDto[],
  groupeIds: number[],
): Set<string> {
  const ids = new Set(groupeIds);
  const tokens = new Set<string>();
  if (ids.size === 0) return tokens;
  for (const g of groupes) {
    if (!ids.has(g.id)) continue;
    for (const r of g.referents ?? []) {
      const t = (r.tokenId ?? '').trim();
      if (t) tokens.add(t);
    }
  }
  return tokens;
}

export function estNonParticipation(
  nonParticipations: NonParticipationPrestataireDto[] | undefined,
  tokenId: string,
  momentId: number,
): boolean {
  const t = tokenId.trim();
  return (nonParticipations ?? []).some(
    (np) => np.tokenId.trim() === t && np.momentId === momentId,
  );
}

function libelleAnimateur(groupes: GroupeDto[], tokenId: string): { nom: string; prenom: string } {
  const t = tokenId.trim();
  for (const g of groupes) {
    const r = (g.referents ?? []).find((x) => (x.tokenId ?? '').trim() === t);
    if (r) return { nom: r.nom, prenom: r.prenom };
  }
  return { nom: '', prenom: '' };
}

export function activiteInternePourTokenMomentDate(
  activitesInternes: ActiviteDto[],
  tokenId: string,
  ymd: string,
  momentId: number,
  conflictMomentIds?: Set<number>,
): ActiviteDto | undefined {
  const t = tokenId.trim();
  return activitesInternes.find((a) => {
    if (jourActivite(a) !== ymd) return false;
    const aMomentId = a.moment?.id;
    if (aMomentId == null) return false;
    if (conflictMomentIds != null ? !conflictMomentIds.has(aMomentId) : aMomentId !== momentId) {
      return false;
    }
    return (a.membres ?? []).some((m) => (m.tokenId ?? '').trim() === t);
  });
}

export function sortieVisiblePourTokenMomentDate(
  prestataires: ActivitePrestataireDto[],
  groupes: GroupeDto[],
  tokenId: string,
  ymd: string,
  momentId: number,
  conflictMomentIds?: Set<number>,
): ActivitePrestataireDto | undefined {
  const t = tokenId.trim();
  for (const sortie of prestataires) {
    if (datePrestataireVersYmd(sortie.date) !== ymd) continue;
    const groupeIds = sortie.groupeIds ?? [];
    if (groupeIds.length === 0) continue;
    const concernes = tokensReferentsConcernesParGroupeIds(groupes, groupeIds);
    if (!concernes.has(t)) continue;
    const momentsConcernes = (sortie.moments ?? []).filter((m) =>
      conflictMomentIds != null ? conflictMomentIds.has(m.id) : m.id === momentId,
    );
    if (!momentsConcernes.some((m) => !estNonParticipation(sortie.nonParticipations, t, m.id))) {
      continue;
    }
    return sortie;
  }
  return undefined;
}

export function listerConflitsActiviteInterneAvecSortie(
  dateYmd: string,
  momentId: number,
  membreTokenIds: string[],
  prestataires: ActivitePrestataireDto[],
  groupes: GroupeDto[],
  moments: MomentDto[],
  activitesInternes: ActiviteDto[],
  options?: { exclureActiviteId?: number | null },
): ConflitActiviteAvecSortie[] {
  const ymd = dateYmd.trim();
  if (!ymd || momentId <= 0) return [];

  const conflictIds = idsEnConflit(momentId, moments);
  const momentNom = moments.find((m) => m.id === momentId)?.nom ?? '—';
  const tokensVus = new Set<string>();
  const out: ConflitActiviteAvecSortie[] = [];

  for (const raw of membreTokenIds) {
    const tokenId = raw.trim();
    if (!tokenId || tokensVus.has(tokenId)) continue;
    tokensVus.add(tokenId);

    const activiteExistante = activiteInternePourTokenMomentDate(
      activitesInternes,
      tokenId,
      ymd,
      momentId,
      conflictIds,
    );
    if (activiteExistante && activiteExistante.id !== options?.exclureActiviteId) continue;

    const sortie = sortieVisiblePourTokenMomentDate(
      prestataires,
      groupes,
      tokenId,
      ymd,
      momentId,
      conflictIds,
    );
    if (!sortie) continue;

    const sortieMomentIds = (sortie.moments ?? [])
      .filter((m) => conflictIds.has(m.id))
      .filter((m) => !estNonParticipation(sortie.nonParticipations, tokenId, m.id))
      .map((m) => m.id);
    if (sortieMomentIds.length === 0) continue;

    const { nom, prenom } = libelleAnimateur(groupes, tokenId);
    out.push({
      tokenId,
      animateurNom: nom,
      animateurPrenom: prenom,
      momentId,
      momentNom,
      sortieId: sortie.id,
      sortieNom: sortie.nom,
      sortieMomentIds,
    });
  }
  return out;
}

export function construireSortiesParAnimateurEtDate(
  prestataires: ActivitePrestataireDto[],
  groupes: GroupeDto[],
  moments: MomentDto[] = [],
): Map<string, Map<string, EntreeSortieCalendrier[]>> {
  const map = new Map<string, Map<string, EntreeSortieCalendrier[]>>();
  for (const sortie of prestataires) {
    const ymd = datePrestataireVersYmd(sortie.date);
    const groupeIds = sortie.groupeIds ?? [];
    if (groupeIds.length === 0) continue;
    const concernes = tokensReferentsConcernesParGroupeIds(groupes, groupeIds);
    const momentIdsAffichables =
      moments.length > 0
        ? elaguerSelectionMomentsSansChevauchementHierarchique(
            moments,
            (sortie.moments ?? []).map((m) => m.id),
          )
        : (sortie.moments ?? []).map((m) => m.id);
    const momentsParId = new Map((sortie.moments ?? []).map((m) => [m.id, m]));
    for (const tokenId of concernes) {
      for (const momentId of momentIdsAffichables) {
        const moment = momentsParId.get(momentId) ?? moments.find((m) => m.id === momentId);
        if (!moment) continue;
        if (estNonParticipation(sortie.nonParticipations, tokenId, moment.id)) continue;
        let inner = map.get(tokenId);
        if (!inner) {
          inner = new Map();
          map.set(tokenId, inner);
        }
        const prev = inner.get(ymd) ?? [];
        inner.set(ymd, [...prev, { sortie, moment }]);
      }
    }
  }
  return map;
}

export function fusionnerItemsCelluleCalendrier(
  activites: ActiviteDto[],
  sorties: EntreeSortieCalendrier[],
  momentsOrdonnes: MomentDto[],
  options: { afficherConflitsNonResolus: boolean },
): CalendrierCelluleItem[] {
  const ordreMoment = new Map(momentsOrdonnes.map((m, i) => [m.id, i]));
  const items: CalendrierCelluleItem[] = [];
  const momentsEnConflit = new Set<number>();

  for (const { sortie, moment } of sorties) {
    const om = ordreMoment.get(moment.id) ?? 9999;
    const conflitActivite = activites.find((a) => a.moment?.id === moment.id);
    if (conflitActivite && options.afficherConflitsNonResolus) {
      momentsEnConflit.add(moment.id);
      items.push({
        kind: 'conflit',
        sortie,
        moment,
        activite: conflitActivite,
        ordreMoment: om,
      });
    } else if (!conflitActivite) {
      items.push({ kind: 'prestataire', sortie, moment, ordreMoment: om });
    }
  }

  for (const a of activites) {
    if (a.moment && momentsEnConflit.has(a.moment.id)) continue;
    const om = a.moment ? (ordreMoment.get(a.moment.id) ?? 9999) : 9999;
    items.push({ kind: 'activite', activite: a, ordreMoment: om });
  }

  return items.sort((x, y) => {
    if (x.ordreMoment !== y.ordreMoment) return x.ordreMoment - y.ordreMoment;
    const nx =
      x.kind === 'activite'
        ? x.activite.nom
        : x.kind === 'prestataire'
          ? x.sortie.nom
          : x.sortie.nom;
    const ny =
      y.kind === 'activite'
        ? y.activite.nom
        : y.kind === 'prestataire'
          ? y.sortie.nom
          : y.sortie.nom;
    return nx.localeCompare(ny, 'fr', { sensitivity: 'base' });
  });
}

export function construireCellulesPlanningParAnimateurEtDate(
  activitesParAnimateurEtDate: Map<string, Map<string, ActiviteDto[]>>,
  sortiesParAnimateurEtDate: Map<string, Map<string, EntreeSortieCalendrier[]>>,
  moments: MomentDto[],
  afficherConflitsNonResolus: boolean,
): Map<string, Map<string, CalendrierCelluleItem[]>> {
  const momentsOrdonnes = aplatirMomentsHierarchiquement(moments);
  const out = new Map<string, Map<string, CalendrierCelluleItem[]>>();
  const tokens = new Set<string>([
    ...activitesParAnimateurEtDate.keys(),
    ...sortiesParAnimateurEtDate.keys(),
  ]);

  for (const tokenId of tokens) {
    const innerAct = activitesParAnimateurEtDate.get(tokenId);
    const innerSort = sortiesParAnimateurEtDate.get(tokenId);
    const ymds = new Set<string>([...(innerAct?.keys() ?? []), ...(innerSort?.keys() ?? [])]);
    const innerOut = new Map<string, CalendrierCelluleItem[]>();
    for (const ymd of ymds) {
      const acts = innerAct?.get(ymd) ?? [];
      const sorts = innerSort?.get(ymd) ?? [];
      innerOut.set(
        ymd,
        fusionnerItemsCelluleCalendrier(acts, sorts, momentsOrdonnes, {
          afficherConflitsNonResolus,
        }),
      );
    }
    out.set(tokenId, innerOut);
  }
  return out;
}

export function cleNonParticipation(tokenId: string, momentId: number): string {
  return `${tokenId.trim()}:${momentId}`;
}

export function conflitsSansChoixResolution<T extends { tokenId: string; momentId: number }>(
  conflits: T[],
  choixParCle: Map<string, ChoixResolutionConflitPrestataire>,
): T[] {
  return conflits.filter((c) => !choixParCle.has(cleNonParticipation(c.tokenId, c.momentId)));
}

export function sortieVersSaveRequest(
  sortie: ActivitePrestataireDto,
  nonParticipations: NonParticipationPrestataireDto[],
): SaveActivitePrestataireRequest {
  return {
    nom: sortie.nom,
    date: datePrestataireVersYmd(sortie.date),
    momentIds: (sortie.moments ?? []).map((m) => m.id),
    heureDepart: sortie.heureDepart,
    heureRetour: sortie.heureRetour,
    informations: sortie.informations,
    telephone: sortie.telephone,
    groupeIds: sortie.groupeIds ?? [],
    nonParticipations,
  };
}

export function fusionnerNonParticipationsApresChoix(
  existantes: NonParticipationPrestataireDto[],
  ajouts: NonParticipationPrestataireDto[],
  retraits: { tokenId: string; momentId: number }[],
): NonParticipationPrestataireDto[] {
  const map = new Map<string, NonParticipationPrestataireDto>();
  for (const np of existantes) {
    map.set(cleNonParticipation(np.tokenId, np.momentId), np);
  }
  for (const np of ajouts) {
    map.set(cleNonParticipation(np.tokenId, np.momentId), np);
  }
  for (const r of retraits) {
    map.delete(cleNonParticipation(r.tokenId, r.momentId));
  }
  return [...map.values()];
}

export function cleRetraitSortieCalendrier(
  sortieId: number,
  momentId: number,
  tokenId: string,
): string {
  return `presta-${sortieId}-${momentId}-${tokenId.trim()}`;
}

/** Tokens d’équipe liés aux groupes sélectionnés (référents + membres d’activités). */
export function tokensEquipePourFiltreGroupesCalendrier(
  groupes: GroupeDto[],
  idsGroupesSelection: ReadonlySet<number>,
  activites: ActiviteDto[],
): Set<string> {
  const tokens = new Set<string>();
  for (const g of groupes) {
    if (!idsGroupesSelection.has(g.id)) continue;
    for (const r of g.referents ?? []) {
      const t = (r.tokenId ?? '').trim();
      if (t) tokens.add(t);
    }
  }
  for (const a of activites) {
    if (!(a.groupeIds ?? []).some((gid) => idsGroupesSelection.has(gid))) continue;
    for (const m of a.membres ?? []) {
      const t = (m.tokenId ?? '').trim();
      if (t) tokens.add(t);
    }
  }
  return tokens;
}

export function itemPasseFiltreGroupeCalendrier(
  item: CalendrierCelluleItem,
  filtreCalendrierGroupeIds: Set<number>,
): boolean {
  if (filtreCalendrierGroupeIds.size === 0) return true;
  if (item.kind === 'activite') {
    return (item.activite.groupeIds ?? []).some((id) => filtreCalendrierGroupeIds.has(id));
  }
  return (item.sortie.groupeIds ?? []).some((id) => filtreCalendrierGroupeIds.has(id));
}

export function equipeFiltreePourCalendrier<T extends { tokenId: string }>(params: {
  equipe: T[];
  filtreTokens: Set<string>;
  filtreGroupeIds: Set<number>;
  groupes: GroupeDto[];
  activites: ActiviteDto[];
  tokenPrioritaire: string;
  equipeAvecTokenEnTeteFn: (membres: T[], token: string) => T[];
}): T[] {
  const {
    equipe,
    filtreTokens,
    filtreGroupeIds,
    groupes,
    activites,
    tokenPrioritaire,
    equipeAvecTokenEnTeteFn,
  } = params;

  let lignes =
    filtreTokens.size === 0 ? equipe : equipe.filter((m) => filtreTokens.has(m.tokenId.trim()));

  if (filtreGroupeIds.size > 0) {
    const tokensDuFiltreGroupe = tokensEquipePourFiltreGroupesCalendrier(
      groupes,
      filtreGroupeIds,
      activites,
    );
    lignes = lignes.filter((m) => tokensDuFiltreGroupe.has(m.tokenId.trim()));
  }

  return equipeAvecTokenEnTeteFn(lignes, tokenPrioritaire);
}

export function idsGroupesCalendrierDepuisValeurs(valeurs: readonly string[]): Set<number> {
  const ids = new Set<number>();
  for (const v of valeurs) {
    const id = Number.parseInt(v, 10);
    if (Number.isFinite(id)) ids.add(id);
  }
  return ids;
}

export function tokensAnimateursCalendrierDepuisValeurs(valeurs: readonly string[]): Set<string> {
  const tokens = new Set<string>();
  for (const v of valeurs) {
    const t = v.trim();
    if (t) tokens.add(t);
  }
  return tokens;
}
