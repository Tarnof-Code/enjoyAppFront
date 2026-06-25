import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addDaysToYmd,
  bornesDebutFenetrePlanning,
  clampYmdEntre,
  construireJoursFenetre,
  libellePlageJours,
  type NombreJoursVuePlanning,
} from '../helpers/planningGrilleUtils';

/** Fenêtre glissante 1, 3 ou 5 jours ; navigation par bonds de la taille de la vue. */
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

  const decalage = useCallback(
    (delta: number) => {
      if (!bornes) return;
      const pasJours = delta * nombreJoursVue;
      setDebutYmd((prev) => {
        const base = prev ? clampYmdEntre(prev, bornes.minStartYmd, bornes.maxStartYmd) : bornes.minStartYmd;
        const next = addDaysToYmd(base, pasJours);
        if (!next) return base;
        return clampYmdEntre(next, bornes.minStartYmd, bornes.maxStartYmd);
      });
    },
    [bornes, nombreJoursVue],
  );

  const definirDebutFenetre = useCallback(
    (ymd: string) => {
      if (!bornes || !ymd) return;
      setDebutYmd(clampYmdEntre(ymd, bornes.minStartYmd, bornes.maxStartYmd));
    },
    [bornes],
  );

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
