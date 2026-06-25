import { useEffect, useMemo, useState } from 'react';

import {
  addDaysToYmd,
  bornesDebutFenetrePlanning,
  clampYmdEntre,
  construireJoursFenetre,
  libellePlageJours,
  type NombreJoursVuePlanning,
} from '../helpers/planningGrilleUtils';

/** Fenêtre glissante 1 ou 3 jours dans la liste des jours du planning. */
export function useFenetreJoursPlanning(jours: string[]) {
  const [nombreJoursVue, setNombreJoursVue] = useState<NombreJoursVuePlanning>(3);
  const [debutYmd, setDebutYmd] = useState('');

  useEffect(() => {
    const bornes = bornesDebutFenetrePlanning(jours, nombreJoursVue);
    if (!bornes) {
      setDebutYmd('');
      return;
    }
    setDebutYmd((prev) => {
      if (!prev) return bornes.minStartYmd;
      return clampYmdEntre(prev, bornes.minStartYmd, bornes.maxStartYmd);
    });
  }, [jours, nombreJoursVue]);

  const bornes = useMemo(
    () => bornesDebutFenetrePlanning(jours, nombreJoursVue),
    [jours, nombreJoursVue],
  );

  const debutEffectif = useMemo(() => {
    if (!bornes) return '';
    if (!debutYmd) return bornes.minStartYmd;
    return clampYmdEntre(debutYmd, bornes.minStartYmd, bornes.maxStartYmd);
  }, [bornes, debutYmd]);

  const joursFenetre = useMemo(
    () => (debutEffectif ? construireJoursFenetre(debutEffectif, nombreJoursVue) : []),
    [debutEffectif, nombreJoursVue],
  );

  const libellePlage = useMemo(() => libellePlageJours(joursFenetre), [joursFenetre]);

  const peutReculer = bornes != null && debutEffectif > bornes.minStartYmd;
  const peutAvancer = bornes != null && debutEffectif < bornes.maxStartYmd;

  const decalage = (delta: number) => {
    if (!bornes) return;
    setDebutYmd((prev) => {
      const base = prev ? clampYmdEntre(prev, bornes.minStartYmd, bornes.maxStartYmd) : bornes.minStartYmd;
      const next = addDaysToYmd(base, delta);
      if (!next) return base;
      return clampYmdEntre(next, bornes.minStartYmd, bornes.maxStartYmd);
    });
  };

  const definirDebutFenetre = (ymd: string) => {
    if (!bornes || !ymd) return;
    setDebutYmd(clampYmdEntre(ymd, bornes.minStartYmd, bornes.maxStartYmd));
  };

  return {
    nombreJoursVue,
    setNombreJoursVue,
    joursFenetre,
    libellePlage,
    debutFenetreYmd: debutEffectif,
    peutReculer,
    peutAvancer,
    decalage,
    definirDebutFenetre,
  };
}
