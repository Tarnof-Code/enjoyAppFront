import type {
  ChambreDto,
  ChambreOccupantDto,
  EnfantDto,
  GenreChambre,
  GroupeDto,
  ProfilUtilisateurDTO,
  SaveChambreRequest,
  TypeChambre,
} from '../types/api';
import { libelleEnfantDuSejour, libelleEquipeDuSejour, trierEquipeDuSejour } from './triListesSejour';

export type MembreEquipePourChambre = Pick<
  ProfilUtilisateurDTO,
  'tokenId' | 'nom' | 'prenom' | 'genre'
>;

export function libelleChambre(chambre: ChambreDto): string {
  const identifiant = chambre.identifiant.trim();
  const nom = chambre.nom?.trim();
  if (nom && nom !== identifiant) return `${identifiant} · ${nom}`;
  return identifiant;
}

export function genrePersonneCompatibleAvecChambre(
  genrePersonne: string | null | undefined,
  genreChambre: GenreChambre,
): boolean {
  if (!genrePersonne?.trim()) return false;
  const g = genrePersonne.trim().toLowerCase();
  switch (genreChambre) {
    case 'MIXTE':
      return true;
    case 'MASCULIN':
      return g === 'masculin';
    case 'FEMININ':
      return g === 'féminin' || g === 'feminin';
    default:
      return false;
  }
}

export type AffectationOccupantIndex = {
  enfantIdVersChambre: Map<number, ChambreDto>;
  membreTokenIdVersChambre: Map<string, ChambreDto>;
};

export function indexerAffectationsOccupants(chambres: ChambreDto[]): AffectationOccupantIndex {
  const enfantIdVersChambre = new Map<number, ChambreDto>();
  const membreTokenIdVersChambre = new Map<string, ChambreDto>();

  for (const chambre of chambres) {
    for (const occupant of chambre.occupants ?? []) {
      if (occupant.enfantId != null) {
        enfantIdVersChambre.set(occupant.enfantId, chambre);
      }
      if (occupant.membreTokenId?.trim()) {
        membreTokenIdVersChambre.set(occupant.membreTokenId.trim(), chambre);
      }
    }
  }

  return { enfantIdVersChambre, membreTokenIdVersChambre };
}

function idsEnfantsDuGroupeChambre(chambre: ChambreDto, groupes: GroupeDto[]): Set<number> | null {
  const groupeId = chambre.groupe?.id;
  if (groupeId == null) return null;
  const groupe = groupes.find((g) => g.id === groupeId);
  if (!groupe) return new Set<number>();
  return new Set((groupe.enfants ?? []).map((e) => e.id));
}

export function enfantsEligiblesPourChambre(
  chambre: ChambreDto,
  enfants: EnfantDto[],
  idsDejaDansChambre: Set<number>,
  groupes: GroupeDto[] = [],
): EnfantDto[] {
  const idsGroupe = idsEnfantsDuGroupeChambre(chambre, groupes);
  return enfants.filter(
    (enfant) =>
      !idsDejaDansChambre.has(enfant.id) &&
      genrePersonneCompatibleAvecChambre(enfant.genre, chambre.genreAutorise) &&
      (idsGroupe == null || idsGroupe.has(enfant.id)),
  );
}

export function membresEligiblesPourChambre(
  chambre: ChambreDto,
  equipe: MembreEquipePourChambre[],
  idsDejaDansChambre: Set<string>,
): MembreEquipePourChambre[] {
  return equipe.filter(
    (membre) =>
      !idsDejaDansChambre.has(membre.tokenId.trim()) &&
      genrePersonneCompatibleAvecChambre(membre.genre, chambre.genreAutorise),
  );
}

export function fusionnerChambreRetourneeDansListe(
  chambres: ChambreDto[],
  chambreMiseAJour: ChambreDto,
): ChambreDto[] {
  const enfantIds = new Set(
    chambreMiseAJour.occupants
      .filter((o) => o.enfantId != null)
      .map((o) => o.enfantId as number),
  );
  const membreIds = new Set(
    chambreMiseAJour.occupants
      .filter((o) => o.membreTokenId?.trim())
      .map((o) => o.membreTokenId!.trim()),
  );

  const existe = chambres.some((c) => c.id === chambreMiseAJour.id);

  return chambres
    .map((c) => {
      if (c.id === chambreMiseAJour.id) return chambreMiseAJour;
      if (enfantIds.size === 0 && membreIds.size === 0) return c;
      const occupants = (c.occupants ?? []).filter((o) => {
        if (o.enfantId != null && enfantIds.has(o.enfantId)) return false;
        const tid = o.membreTokenId?.trim();
        if (tid && membreIds.has(tid)) return false;
        return true;
      });
      if (occupants.length === (c.occupants?.length ?? 0)) return c;
      return { ...c, occupants };
    })
    .concat(existe ? [] : [chambreMiseAJour]);
}

export type ErreursModificationChambre = {
  capaciteMax?: string;
  genreAutorise?: string;
  groupeId?: string;
};

function libelleOccupant(
  occupant: ChambreOccupantDto,
  typeChambre: TypeChambre,
): string {
  return typeChambre === 'ENFANT'
    ? libelleEnfantDuSejour(occupant, null)
    : libelleEquipeDuSejour(occupant, null);
}

function nomsOccupants(occupants: ChambreOccupantDto[], typeChambre: TypeChambre): string {
  return occupants.map((o) => libelleOccupant(o, typeChambre)).join(', ');
}

function occupantsEnfantsIncompatiblesGenre(
  chambre: ChambreDto,
  nouveauGenre: GenreChambre,
  enfants: EnfantDto[],
): ChambreOccupantDto[] {
  const enfantParId = new Map(enfants.map((e) => [e.id, e]));
  return (chambre.occupants ?? []).filter((o) => {
    if (o.enfantId == null) return false;
    const enfant = enfantParId.get(o.enfantId);
    if (!enfant) return false;
    return !genrePersonneCompatibleAvecChambre(enfant.genre, nouveauGenre);
  });
}

function occupantsMembresIncompatiblesGenre(
  chambre: ChambreDto,
  nouveauGenre: GenreChambre,
  equipe: MembreEquipePourChambre[],
): ChambreOccupantDto[] {
  const membreParToken = new Map(equipe.map((m) => [m.tokenId.trim(), m]));
  return (chambre.occupants ?? []).filter((o) => {
    const tid = o.membreTokenId?.trim();
    if (!tid) return false;
    const membre = membreParToken.get(tid);
    if (!membre) return false;
    return !genrePersonneCompatibleAvecChambre(membre.genre, nouveauGenre);
  });
}

function occupantsEnfantsHorsGroupe(
  chambre: ChambreDto,
  nouveauGroupeId: number | null,
  groupes: GroupeDto[],
): ChambreOccupantDto[] {
  if (nouveauGroupeId == null) return [];
  const groupe = groupes.find((g) => g.id === nouveauGroupeId);
  const idsGroupe = new Set((groupe?.enfants ?? []).map((e) => e.id));
  return (chambre.occupants ?? []).filter(
    (o) => o.enfantId != null && !idsGroupe.has(o.enfantId),
  );
}

export function analyserModificationChambreIncompatible(
  chambre: ChambreDto,
  payload: Pick<SaveChambreRequest, 'typeChambre' | 'capaciteMax' | 'genreAutorise' | 'groupeId'>,
  groupes: GroupeDto[],
  enfants: EnfantDto[],
  equipe: MembreEquipePourChambre[] = [],
): ErreursModificationChambre {
  const erreurs: ErreursModificationChambre = {};
  const occupants = chambre.occupants ?? [];
  const nbOccupants = occupants.length;
  if (nbOccupants === 0) return erreurs;

  if (payload.capaciteMax < nbOccupants) {
    erreurs.capaciteMax = `${nbOccupants} occupant(s) présents. Retirez des occupants ou augmentez la capacité.`;
  }

  const typeAffichage = payload.typeChambre ?? chambre.typeChambre;

  if (payload.genreAutorise !== chambre.genreAutorise) {
    const incompatiblesEnfants = occupantsEnfantsIncompatiblesGenre(chambre, payload.genreAutorise, enfants);
    const incompatiblesMembres = occupantsMembresIncompatiblesGenre(chambre, payload.genreAutorise, equipe);
    const incompatibles = [...incompatiblesEnfants, ...incompatiblesMembres];
    if (incompatibles.length > 0) {
      erreurs.genreAutorise = `${nomsOccupants(incompatibles, typeAffichage)} ${incompatibles.length > 1 ? 'ne sont' : "n'est"} pas compatible${incompatibles.length > 1 ? 's' : ''} avec ce genre. Retirez ces occupants d'abord.`;
    }
  }

  if (payload.typeChambre === 'ENFANT') {
    const ancienGroupeId = chambre.groupe?.id ?? null;
    const nouveauGroupeId = payload.groupeId ?? null;
    if (nouveauGroupeId !== ancienGroupeId) {
      const horsGroupe = occupantsEnfantsHorsGroupe(chambre, nouveauGroupeId, groupes);
      if (horsGroupe.length > 0) {
        const libelleGroupe =
          nouveauGroupeId != null
            ? groupes.find((g) => g.id === nouveauGroupeId)?.nom ?? 'ce groupe'
            : 'ce groupe';
        erreurs.groupeId = `${nomsOccupants(horsGroupe, 'ENFANT')} ${horsGroupe.length > 1 ? "n'appartiennent" : "n'appartient"} pas au groupe « ${libelleGroupe} ». Retirez ces occupants d'abord.`;
      }
    }
  }

  return erreurs;
}

export function modificationChambreBloquee(erreurs: ErreursModificationChambre): boolean {
  return !!(erreurs.capaciteMax || erreurs.genreAutorise || erreurs.groupeId);
}

export function equipePourChambres(equipe: ProfilUtilisateurDTO[] | undefined): MembreEquipePourChambre[] {
  return (equipe ?? []).map(({ tokenId, nom, prenom, genre }) => ({ tokenId, nom, prenom, genre }));
}

export function trierMembresEligibles(
  membres: MembreEquipePourChambre[],
  sejour: Parameters<typeof trierEquipeDuSejour>[1],
): MembreEquipePourChambre[] {
  return trierEquipeDuSejour(membres, sejour);
}
