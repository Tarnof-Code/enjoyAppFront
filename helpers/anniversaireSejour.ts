import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

function dateAnniversaireAnnee(annee: number, mois: number, jour: number): dayjs.Dayjs {
  let anniv = dayjs(new Date(annee, mois, jour)).startOf('day');
  if (anniv.month() !== mois) {
    anniv = dayjs(new Date(annee, mois + 1, 0)).startOf('day');
  }
  return anniv;
}

function formatDateAnniversaire(date: dayjs.Dayjs): string {
  const libelle = date.format('dddd D MMMM');
  return libelle.charAt(0).toUpperCase() + libelle.slice(1);
}

/** Retourne la date d'anniversaire (ex. « Lundi 16 juillet ») si elle tombe pendant le séjour. */
export function anniversairePendantSejour(
  dateNaissance: string,
  dateDebut: string | number,
  dateFin: string | number,
): string | null {
  const debut = dayjs(dateDebut).startOf('day');
  const fin = dayjs(dateFin).startOf('day');
  const naissance = dayjs(dateNaissance);
  if (!naissance.isValid() || !debut.isValid() || !fin.isValid()) return null;

  const mois = naissance.month();
  const jour = naissance.date();

  for (let annee = debut.year(); annee <= fin.year(); annee++) {
    const anniv = dateAnniversaireAnnee(annee, mois, jour);
    if (!anniv.isBefore(debut) && !anniv.isAfter(fin)) {
      return formatDateAnniversaire(anniv);
    }
  }

  return null;
}
