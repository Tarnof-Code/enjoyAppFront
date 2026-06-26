import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { JourFenetrePlanning } from '../helpers/planningGrilleUtils';
import { colors, fontSizes, spacing } from '../config/theme';

interface Props {
  joursFenetre: JourFenetrePlanning[];
  aujourdhui: string;
  /** Coin haut-gauche (libellé ligne ou animateur). Omis si la colonne est masquée. */
  colonneGauche?: React.ReactNode;
  /** Jours du séjour : les colonnes hors séjour sont atténuées (calendrier activités). */
  joursSejour?: string[];
}

/** Ligne d'en-tête des jours, affichée au-dessus du corps scrollable de la grille. */
export default function EnteteJoursGrille({
  joursFenetre,
  aujourdhui,
  colonneGauche,
  joursSejour,
}: Props) {
  return (
    <View style={styles.enteteLigne}>
      {colonneGauche}
      {joursFenetre.map(({ ymd, jourSemaine, dateReste }, index) => {
        const estAujourdhui = ymd === aujourdhui;
        const derniereColonne = index === joursFenetre.length - 1;
        const horsSejour = joursSejour != null && !joursSejour.includes(ymd);
        return (
          <View
            key={ymd}
            style={[
              styles.celluleJourEntete,
              styles.celluleJourFlexible,
              derniereColonne && styles.celluleSansBordureDroite,
              horsSejour && styles.celluleHorsSejour,
            ]}
          >
            <Text
              style={[styles.enteteJourSemaine, estAujourdhui && styles.enteteJourAujourdhui]}
            >
              {jourSemaine}
            </Text>
            <Text
              style={[styles.enteteJourDate, estAujourdhui && styles.enteteJourAujourdhui]}
            >
              {dateReste}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  enteteLigne: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  celluleJourEntete: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  celluleJourFlexible: {
    flex: 1,
    minWidth: 0,
  },
  celluleSansBordureDroite: {
    borderRightWidth: 0,
  },
  celluleHorsSejour: {
    opacity: 0.5,
  },
  enteteJourSemaine: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  enteteJourDate: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'center',
  },
  enteteJourAujourdhui: {
    color: colors.primary,
  },
});
