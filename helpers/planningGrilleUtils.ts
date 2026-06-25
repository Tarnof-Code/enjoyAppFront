import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { jourISOdepuisValeurApi } from './dateApi';
import { libelleEquipeDuSejour, trierEquipeDuSejour } from './triListesSejour';
import type {
  DirecteurInfos,
  GroupeDto,
  HoraireDto,
  LieuDto,
  MomentDto,
  PlanningCelluleDto,
  PlanningCellulePayload,
  PlanningGrilleDetailDto,
  PlanningLigneDto,
  PlanningLigneLibelleSource,
  ProfilUtilisateurDTO,
  SejourDTO,
  UsageLieu,
} from '../types/api';

dayjs.locale('fr');

export type MembreEquipePlanning = { tokenId: string; nom: string; prenom: string };

export type NombreJoursVuePlanning = 1 | 3 | 5;

export type JourFenetrePlanning = { ymd: string; jourSemaine: string; dateReste: string };

const USAGES_LIEU_PLANNING: UsageLieu[] = ['SURVEILLANCE', 'RASSEMBLEMENT'];

const LIBELLE_TYPE_GROUPE: Record<GroupeDto['typeGroupe'], string> = {
  THEMATIQUE: 'Thématiques',
  AGE: 'Âge',
  NIVEAU_SCOLAIRE: 'Niveau scolaire',
};

function tailleListe<T>(arr: T[] | null | undefined): number {
  return arr?.length ?? 0;
}

function cleRegroupementPourTri(libelleRegroupement: string | null): string | null {
  if (libelleRegroupement == null || libelleRegroupement === '') return null;
  return libelleRegroupement;
}

function lignesTrieesParOrdre(lignes: PlanningLigneDto[]): PlanningLigneDto[] {
  return [...lignes].sort((a, b) => a.ordre - b.ordre);
}

export function sourceLibellePourApi(d: PlanningGrilleDetailDto): PlanningLigneLibelleSource {
  return d.sourceLibelleLignes ?? 'SAISIE_LIBRE';
}

export function grilleLibelleLignesDesactive(d: PlanningGrilleDetailDto): boolean {
  return d.sourceLibelleLignes == null;
}

export function sourceContenuCellulesEffectif(d: PlanningGrilleDetailDto): PlanningLigneLibelleSource {
  return d.sourceContenuCellules ?? 'SAISIE_LIBRE';
}

export function planningAnimateurPeutModifierCellules(detail: PlanningGrilleDetailDto): boolean {
  return (
    detail.sourceLibelleLignes === 'MEMBRE_EQUIPE' ||
    sourceContenuCellulesEffectif(detail) === 'MEMBRE_EQUIPE'
  );
}

export function peutModifierCellulesPlanning(
  detail: PlanningGrilleDetailDto,
  peutGererStructure: boolean,
): boolean {
  return peutGererStructure || planningAnimateurPeutModifierCellules(detail);
}

export function lignesTriPourAffichageGrille(lignes: PlanningLigneDto[]): PlanningLigneDto[] {
  const tri = lignesTrieesParOrdre(lignes);
  const minOrdreParRg = new Map<string, number>();
  for (const l of lignes) {
    const rg = cleRegroupementPourTri(l.libelleRegroupement);
    if (rg == null) continue;
    const o = l.ordre;
    const prev = minOrdreParRg.get(rg);
    if (prev === undefined || o < prev) minOrdreParRg.set(rg, o);
  }
  return [...tri].sort((a, b) => {
    const rgA = cleRegroupementPourTri(a.libelleRegroupement);
    const rgB = cleRegroupementPourTri(b.libelleRegroupement);
    const primA = rgA == null ? a.ordre : (minOrdreParRg.get(rgA) ?? a.ordre);
    const primB = rgB == null ? b.ordre : (minOrdreParRg.get(rgB) ?? b.ordre);
    if (primA !== primB) return primA - primB;
    const cleSec = (rg: string | null, ligne: PlanningLigneDto) =>
      rg == null ? `\u0001hors:${ligne.id}` : `\u0000sec:${rg}`;
    const cmpSec = cleSec(rgA, a).localeCompare(cleSec(rgB, b));
    if (cmpSec !== 0) return cmpSec;
    if (a.ordre !== b.ordre) return a.ordre - b.ordre;
    return a.id - b.id;
  });
}

export interface RegroupementCellInfo {
  showLeadingCell: boolean;
  libelleRegroupement: string | null;
}

export function infosRegroupementParLigne(lignes: PlanningLigneDto[]): RegroupementCellInfo[] {
  const out: RegroupementCellInfo[] = [];
  let i = 0;
  while (i < lignes.length) {
    const ligne = lignes[i];
    const key = ligne.libelleRegroupement;
    if (key != null) {
      let j = i + 1;
      while (j < lignes.length && lignes[j].libelleRegroupement === key) {
        j++;
      }
      const n = j - i;
      for (let k = 0; k < n; k++) {
        out.push({
          showLeadingCell: k === 0,
          libelleRegroupement: key,
        });
      }
      i = j;
    } else {
      out.push({
        showLeadingCell: true,
        libelleRegroupement: null,
      });
      i++;
    }
  }
  return out;
}

export function joursDuPlanning(grille: PlanningGrilleDetailDto): string[] {
  return [
    ...new Set(
      grille.lignes
        .flatMap((ligne) => ligne.cellules.map((c) => jourISOdepuisValeurApi(c.jour)))
        .filter(Boolean),
    ),
  ].sort();
}

export function cellulePourJour(ligne: PlanningLigneDto, jour: string): PlanningCelluleDto | undefined {
  return ligne.cellules.find((c) => jourISOdepuisValeurApi(c.jour) === jour);
}

export function enteteJourPlanning(ymd: string): { jourSemaine: string; dateReste: string } {
  const d = dayjs(ymd);
  const abrev = d.format('ddd').replace(/\.$/, '');
  const jourSemaine = abrev.charAt(0).toUpperCase() + abrev.slice(1);
  return { jourSemaine, dateReste: d.format('D MMM') };
}

export function libellePlageJours(jours: JourFenetrePlanning[]): string {
  if (jours.length === 0) return '';
  if (jours.length === 1) return dayjs(jours[0].ymd).format('dddd D MMMM');
  const debut = dayjs(jours[0].ymd).format('D MMM');
  const fin = dayjs(jours[jours.length - 1].ymd).format('D MMM');
  return `${debut} — ${fin}`;
}

export function addDaysToYmd(ymd: string, deltaJours: number): string | null {
  const d = dayjs(ymd);
  if (!d.isValid()) return null;
  return d.add(deltaJours, 'day').format('YYYY-MM-DD');
}

export function clampYmdEntre(ymd: string, minYmd: string, maxYmd: string): string {
  if (ymd < minYmd) return minYmd;
  if (ymd > maxYmd) return maxYmd;
  return ymd;
}

export function bornesDebutFenetrePlanning(
  jours: string[],
  nombreJoursFenetre: number,
): { minStartYmd: string; maxStartYmd: string } | null {
  if (jours.length === 0) return null;
  const n = Math.max(1, Math.floor(nombreJoursFenetre));
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  const maxStart = addDaysToYmd(dernier, -(n - 1)) ?? premier;
  return { minStartYmd: premier, maxStartYmd: maxStart < premier ? premier : maxStart };
}

export function construireJoursFenetre(debutYmd: string, nombreJours: NombreJoursVuePlanning): JourFenetrePlanning[] {
  const out: JourFenetrePlanning[] = [];
  let ymd: string | null = debutYmd;
  for (let i = 0; i < nombreJours; i++) {
    if (!ymd) break;
    out.push({ ymd, ...enteteJourPlanning(ymd) });
    ymd = addDaysToYmd(ymd, 1);
  }
  return out;
}

export function membresDirecteurEtEquipe(
  directeur: DirecteurInfos | null | undefined,
  equipe: ProfilUtilisateurDTO[] | undefined,
  sejour: SejourDTO | null,
): MembreEquipePlanning[] {
  const seen = new Set<string>();
  const rows: MembreEquipePlanning[] = [];
  if (directeur?.tokenId) {
    const tid = directeur.tokenId.trim();
    if (tid) {
      seen.add(tid);
      rows.push({ tokenId: tid, nom: directeur.nom, prenom: directeur.prenom });
    }
  }
  for (const m of equipe ?? []) {
    const tid = (m.tokenId ?? '').trim();
    if (!tid || seen.has(tid)) continue;
    seen.add(tid);
    rows.push({ tokenId: tid, nom: m.nom, prenom: m.prenom });
  }
  return trierEquipeDuSejour(rows, sejour);
}

export function lieuxPourPlanning(lieux: LieuDto[]): LieuDto[] {
  return lieux.filter((l) => l.usages.some((u) => USAGES_LIEU_PLANNING.includes(u)));
}

function libelleEntiteAttendu(
  l: PlanningLigneDto,
  sourceLignes: PlanningLigneLibelleSource,
  groupes: GroupeDto[],
  lieux: LieuDto[],
  horaires: HoraireDto[],
  moments: MomentDto[],
): string {
  switch (sourceLignes) {
    case 'GROUPE':
      return groupes.find((g) => g.id === l.libelleGroupeId)?.nom ?? '';
    case 'LIEU':
      return lieux.find((x) => x.id === l.libelleLieuId)?.nom ?? '';
    case 'HORAIRE':
      return horaires.find((h) => h.id === l.libelleHoraireId)?.libelle ?? '';
    case 'MOMENT':
      return moments.find((m) => m.id === l.libelleMomentId)?.nom ?? '';
    default:
      return '';
  }
}

export function libelleLignePourAffichage(
  l: PlanningLigneDto,
  detail: PlanningGrilleDetailDto,
  groupes: GroupeDto[],
  lieux: LieuDto[],
  horaires: HoraireDto[],
  moments: MomentDto[],
  equipe: MembreEquipePlanning[],
  sejour: SejourDTO | null,
): string {
  const sourceLignes = sourceLibellePourApi(detail);
  const t = (l.libelleSaisieLibre ?? '').trim();
  if (t) return t;
  if (l.libelleUtilisateurTokenId) {
    const m = equipe.find((x) => x.tokenId === l.libelleUtilisateurTokenId);
    if (m) {
      const full = libelleEquipeDuSejour(m, sejour);
      if (full) return full;
    }
  }
  const ent = libelleEntiteAttendu(l, sourceLignes, groupes, lieux, horaires, moments);
  if (ent) return ent;
  return '';
}

function membresDepuisTokenIds(
  tokenIds: string[] | null | undefined,
  equipe: MembreEquipePlanning[],
): MembreEquipePlanning[] {
  const byToken = new Map(equipe.map((m) => [m.tokenId.trim().toLowerCase(), m]));
  const out: MembreEquipePlanning[] = [];
  for (const tid of tokenIds ?? []) {
    const t = String(tid).trim();
    if (!t) continue;
    const m = byToken.get(t.toLowerCase());
    if (m) out.push(m);
  }
  return out;
}

/** Prénom seul ; lettres du nom ajoutées si homonymes dans la même cellule. */
export function libelleMembreDansCelluleEquipe(
  membre: MembreEquipePlanning,
  membresCellule: MembreEquipePlanning[],
): string {
  const prenom = (membre.prenom ?? '').trim();
  const nom = (membre.nom ?? '').trim();
  if (!prenom && !nom) return '';

  const prenomNorm = prenom.toLowerCase();
  const memePrenom = membresCellule.filter(
    (m) => (m.prenom ?? '').trim().toLowerCase() === prenomNorm && prenom !== '',
  );

  if (memePrenom.length <= 1) {
    return prenom || nom;
  }

  for (let len = 1; len <= nom.length; len++) {
    const suffix = nom.slice(0, len);
    const label = `${prenom} ${suffix}`;
    const conflit = memePrenom.some((other) => {
      if (other.tokenId.trim() === membre.tokenId.trim()) return false;
      const oNom = (other.nom ?? '').trim();
      const oLabel = `${prenom} ${oNom.slice(0, len)}`;
      return oLabel.toLowerCase() === label.toLowerCase();
    });
    if (!conflit) return label;
  }

  return `${prenom} ${nom}`.trim() || prenom || nom;
}

function resumeMembresEquipeCellule(
  c: PlanningCelluleDto,
  equipe: MembreEquipePlanning[],
): string {
  const membresCellule = membresDepuisTokenIds(c.membreTokenIds, equipe);
  if (membresCellule.length === 0) return '—';
  const labels = membresCellule
    .map((m) => libelleMembreDansCelluleEquipe(m, membresCellule))
    .filter((lab) => lab !== '');
  return labels.length > 0 ? labels.join('\n') : '—';
}

export function resumeCellule(
  c: PlanningCelluleDto | undefined,
  horaires: HoraireDto[],
  moments: MomentDto[],
  groupes: GroupeDto[],
  lieux: LieuDto[],
  equipe: MembreEquipePlanning[],
  sejour: SejourDTO | null,
  sourceContenuCellules?: PlanningLigneLibelleSource,
): string {
  if (!c) return '—';

  if (sourceContenuCellules === 'MEMBRE_EQUIPE') {
    return resumeMembresEquipeCellule(c, equipe);
  }

  const parts: string[] = [];
  const libellesHoraires = c.horaireLibelles?.filter((x) => (x ?? '').trim() !== '');
  const idsHoraires = c.horaireIds ?? [];
  if (libellesHoraires?.length) {
    for (const lab of libellesHoraires) {
      if (lab) parts.push(lab.trim());
    }
  } else if (idsHoraires.length) {
    for (const hid of idsHoraires) {
      const h = horaires.find((x) => x.id === hid);
      if (h) parts.push(h.libelle);
    }
  }
  if (c.texteLibre != null && c.texteLibre.trim() !== '') parts.push(c.texteLibre.trim());
  for (const mid of c.momentIds ?? []) {
    const m = moments.find((x) => x.id === mid);
    if (m) parts.push(m.nom);
  }
  for (const gid of c.groupeIds ?? []) {
    const g = groupes.find((x) => x.id === gid);
    if (g) parts.push(g.nom);
  }
  for (const lid of c.lieuIds ?? []) {
    const l = lieux.find((x) => x.id === lid);
    if (l) parts.push(l.nom);
  }
  for (const tid of c.membreTokenIds ?? []) {
    const m = equipe.find((x) => x.tokenId.trim() === String(tid).trim());
    if (m) {
      const lab = libelleEquipeDuSejour(m, sejour);
      if (lab) parts.push(lab);
    }
  }
  return parts.length ? parts.join(' · ') : '—';
}

export function celluleEstVide(texte: string): boolean {
  return texte === '—';
}

function payloadCelluleVide(p: PlanningCellulePayload): boolean {
  const pasAnim = p.membreTokenIds == null || p.membreTokenIds.length === 0;
  const pasH = tailleListe(p.horaireIds) === 0;
  const pasT = p.texteLibre == null || p.texteLibre.trim() === '';
  const pasM = tailleListe(p.momentIds) === 0;
  const pasG = tailleListe(p.groupeIds) === 0;
  const pasL = tailleListe(p.lieuIds) === 0;
  return pasAnim && pasH && pasT && pasM && pasG && pasL;
}

function famillesIdsMetierRenseignees(p: PlanningCellulePayload): number {
  let n = 0;
  if (tailleListe(p.horaireIds) > 0) n++;
  if (tailleListe(p.momentIds) > 0) n++;
  if (tailleListe(p.groupeIds) > 0) n++;
  if (tailleListe(p.lieuIds) > 0) n++;
  return n;
}

export function erreurValidationCellulePourContenu(
  p: PlanningCellulePayload,
  src: PlanningLigneLibelleSource,
): string | null {
  if (payloadCelluleVide(p)) return null;
  const familles = famillesIdsMetierRenseignees(p);
  switch (src) {
    case 'SAISIE_LIBRE':
      if (familles > 0) {
        return 'En contenu « Saisie libre », ne renseignez pas d’horaire, moment, groupe ou lieu.';
      }
      return null;
    case 'HORAIRE':
      if (tailleListe(p.momentIds) > 0 || tailleListe(p.groupeIds) > 0 || tailleListe(p.lieuIds) > 0) {
        return 'En contenu « Horaire », ne renseignez pas de moments, groupes ou lieux.';
      }
      if (tailleListe(p.horaireIds) === 0) return 'Sélectionnez au moins un horaire.';
      if (p.texteLibre != null && p.texteLibre.trim() !== '') {
        return 'Pas de texte libre pour une cellule « Horaire ».';
      }
      if (p.membreTokenIds != null && p.membreTokenIds.length > 0) {
        return 'Pas de membres d’équipe pour une cellule « Horaire ».';
      }
      return null;
    case 'MOMENT':
      if (tailleListe(p.horaireIds) > 0 || tailleListe(p.groupeIds) > 0 || tailleListe(p.lieuIds) > 0) {
        return 'En contenu « Moment », ne renseignez pas d’horaires, groupes ou lieux.';
      }
      if (tailleListe(p.momentIds) === 0) return 'Sélectionnez au moins un moment.';
      if (p.texteLibre != null && p.texteLibre.trim() !== '') {
        return 'Pas de texte libre pour une cellule « Moment ».';
      }
      if (p.membreTokenIds != null && p.membreTokenIds.length > 0) {
        return 'Pas de membres d’équipe pour une cellule « Moment ».';
      }
      return null;
    case 'GROUPE':
      if (tailleListe(p.horaireIds) > 0 || tailleListe(p.momentIds) > 0 || tailleListe(p.lieuIds) > 0) {
        return 'En contenu « Groupe », ne renseignez pas d’horaires, moments ou lieux.';
      }
      if (tailleListe(p.groupeIds) === 0) return 'Sélectionnez au moins un groupe.';
      if (p.texteLibre != null && p.texteLibre.trim() !== '') {
        return 'Pas de texte libre pour une cellule « Groupe ».';
      }
      if (p.membreTokenIds != null && p.membreTokenIds.length > 0) {
        return 'Pas de membres d’équipe pour une cellule « Groupe ».';
      }
      return null;
    case 'LIEU':
      if (tailleListe(p.horaireIds) > 0 || tailleListe(p.momentIds) > 0 || tailleListe(p.groupeIds) > 0) {
        return 'En contenu « Lieu », ne renseignez pas d’horaires, moments ou groupes.';
      }
      if (tailleListe(p.lieuIds) === 0) return 'Sélectionnez au moins un lieu.';
      if (p.texteLibre != null && p.texteLibre.trim() !== '') {
        return 'Pas de texte libre pour une cellule « Lieu ».';
      }
      if (p.membreTokenIds != null && p.membreTokenIds.length > 0) {
        return 'Pas de membres d’équipe pour une cellule « Lieu ».';
      }
      return null;
    case 'MEMBRE_EQUIPE':
      if (familles > 0) {
        return 'En contenu « Membre d’équipe », ne renseignez pas d’horaire, moment, groupe ou lieu.';
      }
      if (p.texteLibre != null && p.texteLibre.trim() !== '') {
        return 'Cochez uniquement des membres, sans texte libre.';
      }
      if (p.membreTokenIds == null || p.membreTokenIds.length === 0) {
        return 'Indiquez au moins un membre de l’équipe.';
      }
      return null;
    default:
      return null;
  }
}

export function groupesParTypePourPlanning(groupes: GroupeDto[]): { type: GroupeDto['typeGroupe']; label: string; groupes: GroupeDto[] }[] {
  const ordre: GroupeDto['typeGroupe'][] = ['THEMATIQUE', 'AGE', 'NIVEAU_SCOLAIRE'];
  return ordre
    .map((type) => ({
      type,
      label: LIBELLE_TYPE_GROUPE[type],
      groupes: groupes.filter((g) => g.typeGroupe === type).slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    }))
    .filter((bloc) => bloc.groupes.length > 0);
}

export function normaliserTokenIdsCellule(raw: unknown): string[] {
  if (raw == null || !Array.isArray(raw)) return [];
  return raw.map((x) => String(x)).filter((s) => s.length > 0);
}

export function construirePayloadCellule(
  jour: string,
  contenuSrc: PlanningLigneLibelleSource,
  horaireIds: number[],
  momentIds: number[],
  groupeIds: number[],
  lieuIds: number[],
  texteLibre: string,
  membreTokenIds: string[],
): PlanningCellulePayload {
  let horaireIdsOut: number[] | null = null;
  let momentIdsOut: number[] | null = null;
  let groupeIdsOut: number[] | null = null;
  let lieuIdsOut: number[] | null = null;
  let texteLibreOut: string | null = null;
  let membreTokenIdsOut: string[] | null = null;

  switch (contenuSrc) {
    case 'SAISIE_LIBRE':
      texteLibreOut = texteLibre.trim() || null;
      membreTokenIdsOut = membreTokenIds.length ? [...membreTokenIds] : null;
      break;
    case 'MEMBRE_EQUIPE':
      membreTokenIdsOut = membreTokenIds.length ? [...membreTokenIds] : null;
      break;
    case 'HORAIRE':
      horaireIdsOut = horaireIds.length ? [...horaireIds] : null;
      break;
    case 'MOMENT':
      momentIdsOut = momentIds.length ? [...momentIds] : null;
      break;
    case 'GROUPE':
      groupeIdsOut = groupeIds.length ? [...groupeIds] : null;
      break;
    case 'LIEU':
      lieuIdsOut = lieuIds.length ? [...lieuIds] : null;
      break;
    default:
      break;
  }

  return {
    jour,
    membreTokenIds: membreTokenIdsOut,
    horaireIds: horaireIdsOut,
    texteLibre: texteLibreOut,
    momentIds: momentIdsOut,
    groupeIds: groupeIdsOut,
    lieuIds: lieuIdsOut,
  };
}

export function aujourdhuiYmd(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function debutFenetrePourJour(jours: string[], jourCible: string, nombreJours: NombreJoursVuePlanning): string {
  const bornes = bornesDebutFenetrePlanning(jours, nombreJours);
  if (!bornes) return jourCible;
  if (jourCible < bornes.minStartYmd) return bornes.minStartYmd;
  const maxStartPourCible = addDaysToYmd(jourCible, -(nombreJours - 1)) ?? bornes.minStartYmd;
  return clampYmdEntre(maxStartPourCible, bornes.minStartYmd, bornes.maxStartYmd);
}
