import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import Header from '../../Components/Header';
import BoutonModePaysageGrille from '../../Components/BoutonModePaysageGrille';
import ConteneurGrillePaysage from '../../Components/ConteneurGrillePaysage';
import { enumererJoursSejour } from '../../helpers/enumererJoursSejour';
import {
  COULEUR_FOND_CARTE_MENU,
  indexerMenusParJourEtType,
  jourFocusDefautMenus,
  LABELS_TYPE_REPAS,
  menuCelluleEstVide,
  metaAllergenesRegimesMenu,
  ORDRE_REPAS,
  resumeMenuCellule,
} from '../../helpers/menuRepas';
import {
  aujourdhuiYmd,
  debutFenetrePourJour,
  type NombreJoursVuePlanning,
} from '../../helpers/planningGrilleUtils';
import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { useFenetreJoursPlanning } from '../../hooks/useFenetreJoursPlanning';
import { useModePaysageGrille } from '../../hooks/useModePaysageGrille';
import { menuService } from '../../services/menu.service';
import type { MenuRepasDto, TypeRepas } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors, fontSizes, radius, spacing } from '../../config/theme';

dayjs.locale('fr');

const LARGEUR_COLONNE_REPAS = 108;
const SWIPE_SEUIL = 48;

function MenusContent({
  modePaysage,
  basculerModePaysage,
}: {
  modePaysage: boolean;
  basculerModePaysage: () => void;
}) {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejourId = sejour?.id;
  const [menus, setMenus] = useState<MenuRepasDto[]>([]);

  const executer = useCallback(async () => {
    if (sejourId == null || sejour == null) return;
    const dateDebut = dayjs(sejour.dateDebut).format('YYYY-MM-DD');
    const dateFin = dayjs(sejour.dateFin).format('YYYY-MM-DD');
    setMenus(await menuService.getMenusBySejour(sejourId, dateDebut, dateFin));
  }, [sejourId, sejour]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les menus.',
  );

  const jours = useMemo(() => {
    if (!sejour) return [];
    return enumererJoursSejour(sejour.dateDebut, sejour.dateFin);
  }, [sejour]);

  const aujourdhui = aujourdhuiYmd();
  const jourFocus = useMemo(() => jourFocusDefautMenus(jours, aujourdhui), [jours, aujourdhui]);

  const menusParJour = useMemo(() => indexerMenusParJourEtType(menus), [menus]);

  const {
    nombreJoursVue,
    setNombreJoursVue,
    joursFenetre,
    libellePlage,
    peutReculer,
    peutAvancer,
    decalage,
    definirDebutFenetre,
  } = useFenetreJoursPlanning(jours);

  useEffect(() => {
    if (jours.length === 0 || !jourFocus) return;
    definirDebutFenetre(debutFenetrePourJour(jours, jourFocus, nombreJoursVue));
  }, [sejourId, jourFocus, jours, nombreJoursVue, definirDebutFenetre]);

  const afficherBoutonAujourdhui =
    jours.includes(aujourdhui) &&
    joursFenetre.length > 0 &&
    (aujourdhui < joursFenetre[0].ymd || aujourdhui > joursFenetre[joursFenetre.length - 1].ymd);

  const allerAujourdhui = () => {
    definirDebutFenetre(debutFenetrePourJour(jours, aujourdhui, nombreJoursVue));
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .onEnd((event) => {
      if (event.translationX <= -SWIPE_SEUIL && peutAvancer) {
        decalage(1);
      } else if (event.translationX >= SWIPE_SEUIL && peutReculer) {
        decalage(-1);
      }
    });

  const menuPour = (jour: string, type: TypeRepas): MenuRepasDto | undefined =>
    menusParJour.get(jour)?.get(type);

  if (!sejourId) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Aucun séjour sélectionné.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (jours.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Dates du séjour indisponibles.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.barreOutils}>
        <View style={styles.ligneFiltres}>
          <View style={styles.segmentVue}>
            {([1, 3, 5] as NombreJoursVuePlanning[]).map((n) => (
              <Pressable
                key={n}
                onPress={() => setNombreJoursVue(n)}
                style={({ pressed }) => [
                  styles.segmentBtn,
                  nombreJoursVue === n && styles.segmentBtnActif,
                  pressed && styles.segmentBtnPressed,
                ]}
              >
                <Text
                  style={[styles.segmentBtnTexte, nombreJoursVue === n && styles.segmentBtnTexteActif]}
                >
                  {n} j.
                </Text>
              </Pressable>
            ))}
          </View>
          <BoutonModePaysageGrille actif={modePaysage} onPress={basculerModePaysage} />
        </View>

        <View style={styles.navPeriode}>
          <Pressable
            onPress={() => decalage(-1)}
            disabled={!peutReculer}
            style={({ pressed }) => [
              styles.navBtn,
              (!peutReculer || pressed) && styles.navBtnDisabled,
            ]}
            accessibilityLabel="Période précédente"
          >
            <Text style={styles.navBtnTexte}>‹</Text>
          </Pressable>
          <Text style={styles.plageLabel} numberOfLines={2}>
            {libellePlage}
          </Text>
          <Pressable
            onPress={() => decalage(1)}
            disabled={!peutAvancer}
            style={({ pressed }) => [
              styles.navBtn,
              (!peutAvancer || pressed) && styles.navBtnDisabled,
            ]}
            accessibilityLabel="Période suivante"
          >
            <Text style={styles.navBtnTexte}>›</Text>
          </Pressable>
        </View>

        {afficherBoutonAujourdhui ? (
          <Pressable
            onPress={allerAujourdhui}
            style={({ pressed }) => [styles.btnAujourdhui, pressed && styles.btnAujourdhuiPressed]}
          >
            <Text style={styles.btnAujourdhuiTexte}>Aujourd’hui</Text>
          </Pressable>
        ) : null}
      </View>

      <ConteneurGrillePaysage modePaysage={modePaysage}>
        <GestureDetector gesture={swipeGesture}>
          <ScrollView
            style={[styles.grilleScroll, modePaysage && styles.grilleScrollPaysage]}
            contentContainerStyle={styles.grilleContenu}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.grille}>
            <View style={styles.enteteLigne}>
              <View style={[styles.celluleRepas, styles.enteteCoin]} />
              {joursFenetre.map(({ ymd, jourSemaine, dateReste }, index) => {
                const estAujourdhui = ymd === aujourdhui;
                const derniereColonne = index === joursFenetre.length - 1;
                const dansSejour = jours.includes(ymd);
                return (
                  <View
                    key={ymd}
                    style={[
                      styles.celluleJourEntete,
                      styles.celluleJourFlexible,
                      derniereColonne && styles.celluleSansBordureDroite,
                      !dansSejour && styles.celluleHorsSejour,
                    ]}
                  >
                    <Text
                      style={[
                        styles.enteteJourSemaine,
                        estAujourdhui && styles.enteteJourAujourdhui,
                      ]}
                    >
                      {jourSemaine}
                    </Text>
                    <Text
                      style={[
                        styles.enteteJourDate,
                        estAujourdhui && styles.enteteJourAujourdhui,
                      ]}
                    >
                      {dateReste}
                    </Text>
                  </View>
                );
              })}
            </View>

            {ORDRE_REPAS.map((type, indexRepas) => (
              <View
                key={type}
                style={[styles.ligneDonnees, indexRepas === ORDRE_REPAS.length - 1 && styles.derniereLigne]}
              >
                <View style={[styles.celluleRepas, styles.celluleRepasLibelle]}>
                  <Text style={styles.libelleRepasTexte} numberOfLines={3}>
                    {LABELS_TYPE_REPAS[type]}
                  </Text>
                </View>
                {joursFenetre.map(({ ymd }, jourIndex) => {
                  const menu = menuPour(ymd, type);
                  const vide = menuCelluleEstVide(menu);
                  const texte = resumeMenuCellule(menu);
                  const meta = metaAllergenesRegimesMenu(menu);
                  const derniereColonne = jourIndex === joursFenetre.length - 1;
                  return (
                    <View
                      key={`${type}-${ymd}`}
                      style={[
                        styles.celluleDonnees,
                        styles.celluleJourFlexible,
                        derniereColonne && styles.celluleSansBordureDroite,
                        vide && styles.celluleVide,
                        { backgroundColor: COULEUR_FOND_CARTE_MENU[type] },
                      ]}
                    >
                      <Text
                        style={[styles.celluleTexte, vide && styles.celluleTexteVide]}
                        numberOfLines={4}
                      >
                        {texte}
                      </Text>
                      {meta ? (
                        <Text style={styles.celluleMeta} numberOfLines={2}>
                          {meta}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
        </GestureDetector>
      </ConteneurGrillePaysage>
    </View>
  );
}

export default function Menus() {
  const { modePaysage, basculerModePaysage } = useModePaysageGrille();

  return (
    <SafeAreaProvider>
      <Header iconName="utensils" title="Menus" />
      <MenusContent modePaysage={modePaysage} basculerModePaysage={basculerModePaysage} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  barreOutils: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ligneFiltres: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  segmentVue: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  segmentBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  segmentBtnActif: {
    backgroundColor: colors.primary,
  },
  segmentBtnPressed: {
    opacity: 0.85,
  },
  segmentBtnTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
  },
  segmentBtnTexteActif: {
    color: colors.surface,
  },
  navPeriode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navBtn: {
    width: 40,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnTexte: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  plageLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  btnAujourdhui: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  btnAujourdhuiPressed: {
    opacity: 0.85,
  },
  btnAujourdhuiTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  grilleScroll: {
    flex: 1,
  },
  grilleScrollPaysage: {
    width: '100%',
    height: '100%',
  },
  grilleContenu: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  grille: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  enteteLigne: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  enteteCoin: {
    backgroundColor: colors.background,
  },
  celluleRepas: {
    width: LARGEUR_COLONNE_REPAS,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.background,
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
  ligneDonnees: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  derniereLigne: {
    borderBottomWidth: 0,
  },
  celluleRepasLibelle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  libelleRepasTexte: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.text,
  },
  celluleDonnees: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    minHeight: 56,
  },
  celluleVide: {
    opacity: 0.65,
  },
  celluleTexte: {
    fontSize: fontSizes.xs,
    color: colors.text,
    textAlign: 'center',
  },
  celluleTexteVide: {
    color: colors.muted,
  },
  celluleMeta: {
    marginTop: 2,
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing.xxl,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  },
});
