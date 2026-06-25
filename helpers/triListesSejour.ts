/**
 * Tri des listes de personnes d'un séjour selon le réglage partagé venant de l'API
 * (champs `triListesEnfants` / `triListesEquipe` du SejourDTO).
 *
 * Côté mobile : lecture seule. On ne modifie jamais ce paramètre, on lit la valeur
 * portée par le séjour courant et on trie / affiche l'ordre des noms en conséquence.
 */
import type { CritereTriListeApi, SejourDTO } from '../types/api';
import {
  comparerParNomPuisPrenom,
  comparerParPrenomPuisNom,
  type PersonneNomPrenom,
} from './trierUtilisateurs';

export type CritereTriListePersonnes = 'nom' | 'prenom';

/** Convertit le critère API ('NOM' | 'PRENOM') en critère interne ; défaut 'nom'. */
export function critereDepuisApi(critere: CritereTriListeApi | null | undefined): CritereTriListePersonnes {
  return critere === 'PRENOM' ? 'prenom' : 'nom';
}

export function critereEnfantsDuSejour(sejour: SejourDTO | null | undefined): CritereTriListePersonnes {
  return critereDepuisApi(sejour?.triListesEnfants);
}

export function critereEquipeDuSejour(sejour: SejourDTO | null | undefined): CritereTriListePersonnes {
  return critereDepuisApi(sejour?.triListesEquipe);
}

export function trierPersonnesSelonCritere<T extends PersonneNomPrenom>(
  personnes: readonly T[],
  critere: CritereTriListePersonnes,
): T[] {
  const comparer = critere === 'prenom' ? comparerParPrenomPuisNom : comparerParNomPuisPrenom;
  return [...personnes].sort(comparer);
}

export function trierEnfantsDuSejour<T extends PersonneNomPrenom>(
  enfants: readonly T[],
  sejour: SejourDTO | null | undefined,
): T[] {
  return trierPersonnesSelonCritere(enfants, critereEnfantsDuSejour(sejour));
}

export function trierEquipeDuSejour<T extends PersonneNomPrenom>(
  membres: readonly T[],
  sejour: SejourDTO | null | undefined,
): T[] {
  return trierPersonnesSelonCritere(membres, critereEquipeDuSejour(sejour));
}

export type OptionsLibellePersonne = { nomEnMajuscules?: boolean };

/** Libellé « Nom Prénom » ou « Prénom Nom » selon le critère (mot de tri en premier). */
export function libellePersonneSelonCritere(
  prenom: string | null | undefined,
  nom: string | null | undefined,
  critere: CritereTriListePersonnes,
  options: OptionsLibellePersonne = {},
): string {
  const prenomNet = (prenom ?? '').trim();
  const nomBrut = (nom ?? '').trim();
  const nomNet = options.nomEnMajuscules ? nomBrut.toUpperCase() : nomBrut;
  return critere === 'prenom' ? `${prenomNet} ${nomNet}`.trim() : `${nomNet} ${prenomNet}`.trim();
}

export function libelleEnfantDuSejour(
  personne: PersonneNomPrenom,
  sejour: SejourDTO | null | undefined,
  options?: OptionsLibellePersonne,
): string {
  return libellePersonneSelonCritere(personne.prenom, personne.nom, critereEnfantsDuSejour(sejour), options);
}

export function libelleEquipeDuSejour(
  personne: PersonneNomPrenom,
  sejour: SejourDTO | null | undefined,
  options?: OptionsLibellePersonne,
): string {
  return libellePersonneSelonCritere(personne.prenom, personne.nom, critereEquipeDuSejour(sejour), options);
}
