import { useState } from 'react';

/** Bascule l'affichage paysage du tableau (rotation visuelle, appareil reste en portrait). */
export function useModePaysageGrille() {
  const [modePaysage, setModePaysage] = useState(false);

  const basculerModePaysage = () => {
    setModePaysage((actif) => !actif);
  };

  return { modePaysage, basculerModePaysage };
}
