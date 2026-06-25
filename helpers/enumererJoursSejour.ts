import dayjs from 'dayjs';

/** Jours du séjour inclus, format `YYYY-MM-DD`. */
export function enumererJoursSejour(dateDebut: string | number, dateFin: string | number): string[] {
  const debut = dayjs(dateDebut).startOf('day');
  const fin = dayjs(dateFin).startOf('day');
  if (!debut.isValid() || !fin.isValid() || fin.isBefore(debut)) return [];
  const out: string[] = [];
  let cur = debut;
  while (!cur.isAfter(fin)) {
    out.push(cur.format('YYYY-MM-DD'));
    cur = cur.add(1, 'day');
  }
  return out;
}
