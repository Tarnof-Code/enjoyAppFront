const LOCALE_COMPARAISON = 'fr';
const OPTIONS_COMPARAISON = { sensitivity: 'base' } as const;

/** Objet minimal nom + prénom (équipe, référents, enfants, etc.). */
export type PersonneNomPrenom = { nom?: string | null; prenom?: string | null };

function normaliserChamp(valeur: string | null | undefined): string {
  return valeur?.toLocaleLowerCase() ?? '';
}

function comparerChamps(a: string, b: string): number {
  return a.localeCompare(b, LOCALE_COMPARAISON, OPTIONS_COMPARAISON);
}

/** Comparaison « Prénom Nom » : tri par prénom, puis par nom. */
export function comparerParPrenomPuisNom(a: PersonneNomPrenom, b: PersonneNomPrenom): number {
  const comparaisonPrenom = comparerChamps(normaliserChamp(a.prenom), normaliserChamp(b.prenom));
  if (comparaisonPrenom !== 0) return comparaisonPrenom;
  return comparerChamps(normaliserChamp(a.nom), normaliserChamp(b.nom));
}

/** Comparaison « Nom Prénom » : tri par nom, puis par prénom. */
export function comparerParNomPuisPrenom(a: PersonneNomPrenom, b: PersonneNomPrenom): number {
  const comparaisonNom = comparerChamps(normaliserChamp(a.nom), normaliserChamp(b.nom));
  if (comparaisonNom !== 0) return comparaisonNom;
  return comparerChamps(normaliserChamp(a.prenom), normaliserChamp(b.prenom));
}
