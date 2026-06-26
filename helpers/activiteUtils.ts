import type {
  ActiviteDto,
  ActiviteMembreEquipeInfo,
  ActivitePrestataireDto,
  EnfantDto,
  EnfantParticipantInfo,
  GroupeDto,
  LieuDto,
  MomentDto,
  SejourDTO,
  UpdateActiviteRequest,
} from '../types/api';
import { jourISOdepuisValeurApi } from './dateApi';
import { datePrestataireVersYmd } from './activitePrestataireCalendrier';
import { aplatirMomentsHierarchiquement, idsEnConflit } from './construireArbreMoments';
import { peutGererMembresEquipeSejour } from './peutGererMembresEquipeSejour';
import { libelleEnfantDuSejour, trierEnfantsDuSejour } from './triListesSejour';
import type { PersonneNomPrenom } from './trierUtilisateurs';

const CALENDRIER_TYPE_NB_TEINTES = 36;

export function jourActivite(activite: ActiviteDto): string {
  return jourISOdepuisValeurApi(activite.date as unknown) ?? '';
}

export function couleurFondCalendrierPourTypeActivite(typeId: number | undefined): string {
  if (typeId == null || !Number.isFinite(typeId)) {
    return '#f5f6f8';
  }
  const idx = (Math.imul(typeId, 2654435761) >>> 0) % CALENDRIER_TYPE_NB_TEINTES;
  const h = idx * (360 / CALENDRIER_TYPE_NB_TEINTES);
  return `hsl(${h}, 50%, 87%)`;
}

export function trierActivitesPourCellule(activites: ActiviteDto[], moments: MomentDto[]): ActiviteDto[] {
  const ordreMoment = new Map(
    aplatirMomentsHierarchiquement(moments).map((m, i) => [m.id, i]),
  );
  return [...activites].sort((a, b) => {
    const ia = a.moment ? (ordreMoment.get(a.moment.id) ?? 9999) : 9999;
    const ib = b.moment ? (ordreMoment.get(b.moment.id) ?? 9999) : 9999;
    if (ia !== ib) return ia - ib;
    return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
  });
}

export function indexerActivitesParAnimateurEtJour(
  activites: ActiviteDto[],
  tokenIdsEquipe: string[],
  moments: MomentDto[],
): Map<string, Map<string, ActiviteDto[]>> {
  const map = new Map<string, Map<string, ActiviteDto[]>>();
  for (const tokenId of tokenIdsEquipe) {
    map.set(tokenId, new Map());
  }
  for (const activite of activites) {
    const ymd = jourActivite(activite);
    if (!ymd) continue;
    for (const membre of activite.membres ?? []) {
      const tid = (membre.tokenId ?? '').trim();
      if (!tid) continue;
      let inner = map.get(tid);
      if (!inner) {
        inner = new Map();
        map.set(tid, inner);
      }
      const prev = inner.get(ymd) ?? [];
      inner.set(ymd, [...prev, activite]);
    }
  }
  for (const inner of map.values()) {
    for (const [ymd, cellule] of inner) {
      inner.set(ymd, trierActivitesPourCellule(cellule, moments));
    }
  }
  return map;
}

export type ContenuCarteActiviteCellule = {
  moment: string | null;
  nom: string;
  metas: string[];
};

/** Contenu carte calendrier activité (ordre aligné web `ListeActivitesCalendrier`). */
export function contenuCarteActiviteCellule(
  activite: ActiviteDto,
  groupesParId: Map<number, string>,
  tokenAnimateurLigne: string,
  libelleMembre: (m: ActiviteMembreEquipeInfo) => string,
): ContenuCarteActiviteCellule {
  const metas: string[] = [];
  const lieu = activite.lieu?.nom?.trim();
  if (lieu) metas.push(`Lieu : ${lieu}`);

  const tidLigne = tokenAnimateurLigne.trim();
  const autresAnimateurs = (activite.membres ?? []).filter(
    (m) => (m.tokenId ?? '').trim() !== tidLigne,
  );
  if (autresAnimateurs.length > 0) {
    const libelles = autresAnimateurs
      .map((m) => libelleMembre(m).trim())
      .filter(Boolean)
      .join(', ');
    if (libelles) metas.push(`Avec : ${libelles}`);
  }

  if ((activite.groupeIds ?? []).length > 0) {
    const nomsGroupes = (activite.groupeIds ?? [])
      .map((id) => groupesParId.get(id))
      .filter((v): v is string => !!v);
    metas.push(`Groupes : ${nomsGroupes.length > 0 ? nomsGroupes.join(', ') : '—'}`);
  }

  return {
    moment: activite.moment?.nom?.trim() || null,
    nom: activite.nom.trim(),
    metas,
  };
}

/** Enfants des groupes rattachés à une activité (dédupliqués, triés). */
export function enfantsEligiblesPourGroupesActivite(
  groupes: readonly GroupeDto[],
  groupeIds: readonly number[],
  sejour: SejourDTO | null | undefined,
): EnfantDto[] {
  const idsVu = new Set<number>();
  const result: EnfantDto[] = [];
  for (const gid of groupeIds) {
    const g = groupes.find((x) => x.id === gid);
    if (!g) continue;
    for (const e of g.enfants ?? []) {
      if (!idsVu.has(e.id)) {
        idsVu.add(e.id);
        result.push(e);
      }
    }
  }
  return trierEnfantsDuSejour(result, sejour);
}

/** Enfants déjà affectés à une autre activité ou sortie le même jour (créneaux chevauchants). */
export function idsEnfantsDejaAffectesAutreEvenement(
  activites: readonly ActiviteDto[],
  prestataires: readonly ActivitePrestataireDto[],
  dateYmd: string,
  momentIds: readonly number[],
  moments: readonly MomentDto[],
  options?: {
    excludeActiviteId?: number | null;
    excludePrestataireId?: number | null;
  },
): Map<number, { activiteNom: string; momentNom: string }> {
  const ymd = dateYmd.trim();
  if (!ymd || momentIds.length === 0) return new Map();

  const result = new Map<number, { activiteNom: string; momentNom: string }>();

  const momentsEnConflit = (idsA: readonly number[], idsB: readonly number[]): boolean => {
    for (const a of idsA) {
      const conflicts = idsEnConflit(a, moments);
      for (const b of idsB) {
        if (conflicts.has(b)) return true;
      }
    }
    return false;
  };

  for (const a of activites) {
    if (options?.excludeActiviteId != null && a.id === options.excludeActiviteId) continue;
    if (jourActivite(a) !== ymd) continue;
    const aMomentId = a.moment?.id;
    if (aMomentId == null) continue;
    if (!momentsEnConflit(momentIds, [aMomentId])) continue;
    for (const e of a.enfants ?? []) {
      result.set(e.id, {
        activiteNom: a.nom,
        momentNom: a.moment?.nom ?? '—',
      });
    }
  }

  for (const s of prestataires) {
    if (options?.excludePrestataireId != null && s.id === options.excludePrestataireId) continue;
    if (datePrestataireVersYmd(s.date) !== ymd) continue;
    const sortieMomentIds = (s.moments ?? []).map((m) => m.id);
    if (!momentsEnConflit(momentIds, sortieMomentIds)) continue;
    const momentNom =
      (s.moments ?? [])
        .map((m) => m.nom.trim())
        .filter(Boolean)
        .join(', ') || '—';
    for (const e of s.enfants ?? []) {
      result.set(e.id, {
        activiteNom: s.nom,
        momentNom,
      });
    }
  }

  return result;
}

export function libelleEnfantsParticipants(
  enfants: readonly { prenom: string; nom: string }[] | null | undefined,
  sejour: SejourDTO,
): string {
  if (!enfants?.length) return '';
  return trierEnfantsDuSejour([...enfants], sejour)
    .map((e) => libelleEnfantDuSejour(e, sejour))
    .join(', ');
}

/**
 * Participants effectifs d'une sortie : assignation individuelle enregistrée,
 * ou à défaut les enfants des groupes prévus (`groupeIds`).
 */
export function enfantsEffectifsSortie(
  sortie: ActivitePrestataireDto,
  groupes: readonly GroupeDto[],
  sejour: SejourDTO | null | undefined,
): EnfantParticipantInfo[] {
  const assignes = sortie.enfants ?? [];
  if (assignes.length > 0) return assignes;
  return enfantsEligiblesPourGroupesActivite(groupes, sortie.groupeIds ?? [], sejour);
}

export function idsEnfantsSelectionInitialeSortie(
  sortie: ActivitePrestataireDto,
  groupes: readonly GroupeDto[],
  sejour: SejourDTO | null | undefined,
): number[] {
  return enfantsEffectifsSortie(sortie, groupes, sejour).map((e) => e.id);
}

/** Enfants déjà affectés à une autre activité sur le même jour et créneau (hiérarchie des moments). */
export function idsEnfantsDejaAffectesAutreActivite(
  activites: readonly ActiviteDto[],
  dateYmd: string,
  momentId: number,
  moments: readonly MomentDto[],
  excludeActiviteId?: number | null,
): Map<number, { activiteNom: string; momentNom: string }> {
  const ymd = dateYmd.trim();
  if (!ymd || momentId <= 0) return new Map();

  const conflictIds = idsEnConflit(momentId, moments);
  const result = new Map<number, { activiteNom: string; momentNom: string }>();

  for (const a of activites) {
    if (excludeActiviteId != null && a.id === excludeActiviteId) continue;
    if (jourActivite(a) !== ymd) continue;
    const aMomentId = a.moment?.id;
    if (aMomentId == null || !conflictIds.has(aMomentId)) continue;
    for (const e of a.enfants ?? []) {
      result.set(e.id, {
        activiteNom: a.nom,
        momentNom: a.moment?.nom ?? '—',
      });
    }
  }

  return result;
}

export function enfantActiviteCorrespondRecherche(
  recherche: string,
  enfant: Pick<EnfantDto, 'prenom' | 'nom'>,
): boolean {
  const r = recherche.trim().toLowerCase();
  if (!r) return true;
  const haystacks = [
    `${enfant.prenom} ${enfant.nom}`,
    `${enfant.nom} ${enfant.prenom}`,
    enfant.prenom,
    enfant.nom,
  ].map((s) => s.toLowerCase());
  return haystacks.some((h) => h.includes(r));
}

export function groupeIdsReferentsPourToken(groupes: GroupeDto[], tokenId: string): Set<number> {
  const ids = new Set<number>();
  const tid = tokenId.trim();
  for (const g of groupes) {
    if ((g.referents ?? []).some((r) => (r.tokenId ?? '').trim() === tid)) {
      ids.add(g.id);
    }
  }
  return ids;
}

/** Groupes par âge ou par niveau scolaire uniquement. */
export function groupesAgeOuNiveau(groupes: readonly GroupeDto[]): GroupeDto[] {
  return groupes.filter(
    (g) => g.typeGroupe === 'AGE' || g.typeGroupe === 'NIVEAU_SCOLAIRE',
  );
}

function groupeAReferentPrioritaire(groupe: GroupeDto, tokenIdsPrioritaires: Set<string>): boolean {
  return (groupe.referents ?? []).some((r) => tokenIdsPrioritaires.has((r.tokenId ?? '').trim()));
}

/** Référent(s) prioritaire(s) en tête, puis tri alphabétique par nom. */
export function trierGroupesReferentsPuisNom(
  groupes: readonly GroupeDto[],
  tokenIdsReferentsPrioritaires: Iterable<string> = [],
): GroupeDto[] {
  const tokens = new Set(
    [...tokenIdsReferentsPrioritaires].map((t) => t.trim()).filter((t) => t !== ''),
  );
  const comparer = (a: GroupeDto, b: GroupeDto) =>
    a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
  if (tokens.size === 0) return [...groupes].sort(comparer);
  return [...groupes].sort((a, b) => {
    const aPrioritaire = groupeAReferentPrioritaire(a, tokens);
    const bPrioritaire = groupeAReferentPrioritaire(b, tokens);
    if (aPrioritaire !== bPrioritaire) return aPrioritaire ? -1 : 1;
    return comparer(a, b);
  });
}

/** Options filtre groupes calendrier activités (âge / niveau, groupes référent en tête). */
export function groupesFiltreCalendrierActivites(
  groupes: readonly GroupeDto[],
  tokenReferentPrioritaire: string,
): GroupeDto[] {
  const ageOuNiveau = groupesAgeOuNiveau(groupes);
  const token = tokenReferentPrioritaire.trim();
  return trierGroupesReferentsPuisNom(ageOuNiveau, token ? [token] : []);
}

/** Groupes présélectionnés à l’ouverture du formulaire création. */
export function groupeIdsDefautActivite(params: {
  groupes: GroupeDto[];
  equipe: { tokenId: string }[];
  animateurTokenIdInitial: string | null;
  tokenSelf: string;
}): string[] {
  const { groupes, equipe, animateurTokenIdInitial, tokenSelf } = params;
  const initialGroupes: string[] = [];
  const animateur = animateurTokenIdInitial?.trim();
  if (animateur && equipe.some((m) => m.tokenId.trim() === animateur)) {
    groupeIdsReferentsPourToken(groupes, animateur).forEach((id) => initialGroupes.push(String(id)));
  } else if (tokenSelf && equipe.some((m) => m.tokenId.trim() === tokenSelf)) {
    groupeIdsReferentsPourToken(groupes, tokenSelf).forEach((id) => initialGroupes.push(String(id)));
  }
  if (initialGroupes.length === 0 && groupes.length === 1) {
    initialGroupes.push(String(groupes[0].id));
  }
  return initialGroupes;
}

/** Animateurs présélectionnés à l’ouverture du formulaire création. */
export function tokensAnimateursDefautActivite(params: {
  equipe: { tokenId: string }[];
  animateurTokenIdInitial: string | null;
  tokenSelf: string;
  estAnimateurRestreint: boolean;
  tokenConnecteDansEquipe: boolean;
}): string[] {
  const {
    equipe,
    animateurTokenIdInitial,
    tokenSelf,
    estAnimateurRestreint,
    tokenConnecteDansEquipe,
  } = params;
  const initialTokens: string[] = [];
  const animateur = animateurTokenIdInitial?.trim();
  if (animateur && equipe.some((m) => m.tokenId.trim() === animateur)) {
    initialTokens.push(animateur);
  } else if (equipe.length === 1) {
    initialTokens.push((equipe[0].tokenId ?? '').trim());
  }
  if (estAnimateurRestreint && tokenSelf && tokenConnecteDansEquipe && !initialTokens.includes(tokenSelf)) {
    initialTokens.push(tokenSelf);
  }
  return initialTokens;
}

/** Remonte les options dont `value` est dans `valeursEnTete` (ordre conservé). */
export function optionsAvecValeursEnTete<T extends { value: string }>(
  options: readonly T[],
  valeursEnTete: readonly string[],
): T[] {
  if (valeursEnTete.length === 0) return [...options];
  const deja = new Set<string>();
  const premiers: T[] = [];
  for (const valeur of valeursEnTete) {
    const v = valeur.trim();
    const opt = options.find((o) => o.value === valeur || o.value.trim() === v);
    if (opt && !deja.has(opt.value)) {
      premiers.push(opt);
      deja.add(opt.value);
    }
  }
  return [...premiers, ...options.filter((o) => !deja.has(o.value))];
}

/** Met une valeur en tête (ex. animateur de la ligne cliquée), même si absente de la liste. */
export function valeursEnTeteAvecPrioritaire(
  valeurs: readonly string[],
  prioritaire: string,
): string[] {
  const p = prioritaire.trim();
  if (!p) return [...valeurs];
  const exact = valeurs.find((v) => v.trim() === p);
  const rest = valeurs.filter((v) => v.trim() !== p);
  return exact ? [exact, ...rest] : [p, ...rest];
}

export function libellesGroupesReferentParToken(
  groupes: GroupeDto[],
): Map<string, string> {
  const map = new Map<string, string[]>();
  for (const g of groupes) {
    for (const r of g.referents ?? []) {
      const tid = (r.tokenId ?? '').trim();
      if (!tid) continue;
      const prev = map.get(tid) ?? [];
      prev.push(g.nom);
      map.set(tid, prev);
    }
  }
  const out = new Map<string, string>();
  for (const [tid, noms] of map) {
    out.set(tid, noms.join(', '));
  }
  return out;
}

export function lieuxPourActivite(lieux: LieuDto[]): LieuDto[] {
  return lieux
    .filter((l) => l.usages?.includes('ACTIVITE'))
    .slice()
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
}

export function trierMomentsPourActivite(moments: MomentDto[]) {
  return aplatirMomentsHierarchiquement(moments);
}

export function trierTypesActiviteParLibelle<T extends { libelle: string }>(types: T[]): T[] {
  return types.slice().sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr', { sensitivity: 'base' }));
}

export function jourFocusDefautActivites(jours: string[], aujourdhuiYmd: string): string {
  if (jours.length === 0) return '';
  if (jours.includes(aujourdhuiYmd)) return aujourdhuiYmd;
  return jours[0];
}

export function peutGererActivitesComplet(
  tokenUtilisateur: string | null | undefined,
  directeur: SejourDTO['directeur'],
  equipe: SejourDTO['equipe'],
): boolean {
  return peutGererMembresEquipeSejour(tokenUtilisateur, directeur, equipe);
}

export function peutModifierActivite(
  activite: ActiviteDto,
  peutGererComplet: boolean,
  tokenUtilisateur: string | null | undefined,
): boolean {
  if (peutGererComplet) return true;
  const tid = tokenUtilisateur?.trim();
  if (!tid) return false;
  return (activite.membres ?? []).some((m) => (m.tokenId ?? '').trim() === tid);
}

export function ligneCalendrierActiviteEditable(
  tokenLigne: string,
  peutGererComplet: boolean,
  tokenUtilisateur: string | null | undefined,
): boolean {
  if (peutGererComplet) return true;
  const tid = tokenUtilisateur?.trim();
  if (!tid) return false;
  return tokenLigne.trim() === tid;
}

export function activiteVersUpdateRequest(
  activite: ActiviteDto,
  overrides?: Partial<UpdateActiviteRequest>,
): UpdateActiviteRequest {
  return {
    date: jourActivite(activite),
    nom: activite.nom,
    description: activite.description ?? null,
    membreTokenIds: (activite.membres ?? [])
      .map((m) => m.tokenId)
      .filter((id): id is string => Boolean(id?.trim())),
    groupeIds: [...(activite.groupeIds ?? [])].sort((a, b) => a - b),
    typeActiviteId: activite.typeActivite.id,
    lieuId: activite.lieu?.id ?? null,
    momentId: activite.moment?.id ?? null,
    enfantIds: (activite.enfants ?? []).map((e) => e.id).sort((a, b) => a - b),
    ...overrides,
  };
}

export function equipeAvecTokenEnTete<T extends PersonneNomPrenom & { tokenId: string }>(
  membres: T[],
  tokenPrioritaire: string,
): T[] {
  const t = tokenPrioritaire.trim();
  if (!t) return membres;
  const idx = membres.findIndex((m) => (m.tokenId ?? '').trim() === t);
  if (idx <= 0) return membres;
  const copy = [...membres];
  const [premier] = copy.splice(idx, 1);
  return [premier, ...copy];
}
