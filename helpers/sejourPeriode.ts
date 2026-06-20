import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import type { SejourDTO } from '../types/api';

dayjs.locale('fr');

/** Période courte : début sans année, fin avec année (« 12 juil. — 26 juil. 2026 »). */
export function formatPeriodeSejourCourte(sejour: SejourDTO): string {
  const debut = dayjs(sejour.dateDebut).format('DD MMM');
  const fin = dayjs(sejour.dateFin).format('DD MMM YYYY');
  return `${debut} — ${fin}`;
}

/** Période complète : année des deux côtés (« 12 juil. 2026 — 26 juil. 2026 »). */
export function formatPeriodeSejour(sejour: SejourDTO): string {
  const debut = dayjs(sejour.dateDebut).format('DD MMM YYYY');
  const fin = dayjs(sejour.dateFin).format('DD MMM YYYY');
  return `${debut} — ${fin}`;
}
