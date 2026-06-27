import React, { useCallback, useMemo, useState } from 'react';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import Header from '../../Components/Header';
import EcranListeFond from '../../Components/EcranListeFond';
import BoutonModePaysageGrille from '../../Components/BoutonModePaysageGrille';
import ConteneurGrillePaysage from '../../Components/ConteneurGrillePaysage';
import EnteteJoursGrille from '../../Components/EnteteJoursGrille';
import PlanningCelluleModal, {
  type ResultatEnregistrementCellule,
} from '../../Components/PlanningCelluleModal';
import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { useFenetreJoursPlanning } from '../../hooks/useFenetreJoursPlanning';
import { useModePaysageGrille } from '../../hooks/useModePaysageGrille';
import { useRafraichirSejourCourant } from '../../hooks/useRafraichirSejourCourant';
import { enumererJoursSejour } from '../../helpers/enumererJoursSejour';
import { peutGererMembresEquipeSejour } from '../../helpers/peutGererMembresEquipeSejour';
import {
  aujourdhuiYmd,
  celluleEstVide,
  cellulePourJour,
  debutFenetrePourJour,
  grilleLibelleLignesDesactive,
  infosRegroupementParLigne,
  libelleLignePourAffichage,
  lieuxPourPlanning,
  lignesTriPourAffichageGrille,
  membresDirecteurEtEquipe,
  peutModifierCellulePlanning,
  resumeCellule,
  sourceContenuCellulesEffectif,
  type NombreJoursVuePlanning,
} from '../../helpers/planningGrilleUtils';
import { planningGrilleService } from '../../services/planningGrille.service';
import { momentService } from '../../services/moment.service';
import { lieuService } from '../../services/lieu.service';
import { horaireService } from '../../services/horaire.service';
import { groupeService } from '../../services/groupe.service';
import type { OrganisationStackParamList } from '../../Navigators/types';
import type {
  GroupeDto,
  HoraireDto,
  LieuDto,
  MomentDto,
  PlanningGrilleDetailDto,
  PlanningLigneDto,
} from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors, fontSizes, radius, spacing } from '../../config/theme';

dayjs.locale('fr');

type Props = NativeStackScreenProps<OrganisationStackParamList, 'GrilleDetail'>;

type GrilleDetailContentProps = Props & {
  modePaysage: boolean;
  basculerModePaysage: () => void;
};

const LARGEUR_COLONNE_LIBELLE = 108;
const SWIPE_SEUIL = 48;

function GrilleDetailContent({ route, navigation, modePaysage, basculerModePaysage }: GrilleDetailContentProps) {
  const { grilleId } = route.params;
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const tokenUtilisateur = useAppSelector((state) => state.auth.tokenId);
  const sejourId = sejour?.id;

  const [grille, setGrille] = useState<PlanningGrilleDetailDto | null>(null);
  const [moments, setMoments] = useState<MomentDto[]>([]);
  const [lieux, setLieux] = useState<LieuDto[]>([]);
  const [groupes, setGroupes] = useState<GroupeDto[]>([]);
  const [horaires, setHoraires] = useState<HoraireDto[]>([]);

  const [cellModalVisible, setCellModalVisible] = useState(false);
  const [cellSubmitting, setCellSubmitting] = useState(false);
  const [cellError, setCellError] = useState<string | null>(null);
  const [cellLigne, setCellLigne] = useState<PlanningLigneDto | null>(null);
  const [cellJour, setCellJour] = useState<string | null>(null);

  const rafraichirSejour = useRafraichirSejourCourant();

  const executer = useCallback(async () => {
    if (sejourId == null) return;
    const [, detail, momentsArr, lieuxArr, groupesArr, horairesArr] = await Promise.all([
      rafraichirSejour(),
      planningGrilleService.getPlanningGrilleById(sejourId, grilleId),
      momentService.getMomentsBySejour(sejourId).catch(() => []),
      lieuService.getLieuxBySejour(sejourId).catch(() => []),
      groupeService.getGroupesBySejour(sejourId).catch(() => []),
      horaireService.getHorairesBySejour(sejourId).catch(() => []),
    ]);
    setGrille(detail);
    setMoments(momentsArr);
    setLieux(lieuxArr);
    setGroupes(groupesArr);
    setHoraires(horairesArr);
  }, [sejourId, grilleId, rafraichirSejour]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger le planning.',
  );

  const jours = useMemo(() => {
    if (!sejour) return [];
    return enumererJoursSejour(sejour.dateDebut, sejour.dateFin);
  }, [sejour]);
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

  const lieuxPlanning = useMemo(() => lieuxPourPlanning(lieux), [lieux]);
  const membres = useMemo(
    () => membresDirecteurEtEquipe(sejour?.directeur, sejour?.equipe, sejour),
    [sejour],
  );
  const peutGererStructure = useMemo(
    () => peutGererMembresEquipeSejour(tokenUtilisateur, sejour?.directeur, sejour?.equipe),
    [tokenUtilisateur, sejour],
  );

  const celluleEditable = (ligne: PlanningLigneDto): boolean =>
    grille
      ? peutModifierCellulePlanning(grille, ligne, peutGererStructure, tokenUtilisateur)
      : false;
  const afficherColonneLibelle = grille ? !grilleLibelleLignesDesactive(grille) : false;

  const lignesTriees = useMemo(
    () => (grille ? lignesTriPourAffichageGrille(grille.lignes) : []),
    [grille],
  );
  const regroupements = useMemo(() => infosRegroupementParLigne(lignesTriees), [lignesTriees]);

  const aujourdhui = aujourdhuiYmd();
  const afficherBoutonAujourdhui =
    jours.includes(aujourdhui) &&
    joursFenetre.length > 0 &&
    (aujourdhui < joursFenetre[0].ymd ||
      aujourdhui > joursFenetre[joursFenetre.length - 1].ymd);

  const allerAujourdhui = () => {
    definirDebutFenetre(debutFenetrePourJour(jours, aujourdhui, nombreJoursVue));
  };

  const ouvrirCellule = (ligne: PlanningLigneDto, jour: string) => {
    if (!grille || !celluleEditable(ligne)) return;
    setCellError(null);
    setCellLigne(ligne);
    setCellJour(jour);
    setCellModalVisible(true);
  };

  const fermerCellule = () => {
    if (cellSubmitting) return;
    setCellModalVisible(false);
    setCellLigne(null);
    setCellJour(null);
    setCellError(null);
  };

  const rechargerGrille = async () => {
    if (sejourId == null) return;
    setGrille(await planningGrilleService.getPlanningGrilleById(sejourId, grilleId));
  };

  const handleEnregistrerCellule = async (result: ResultatEnregistrementCellule) => {
    if (sejourId == null || !grille || !cellLigne || !cellJour) return;
    setCellSubmitting(true);
    setCellError(null);
    try {
      if (result.type === 'ma-presence') {
        await planningGrilleService.modifierMaPresenceCellulePlanning(
          sejourId,
          grille.id,
          cellLigne.id,
          cellJour,
          { present: result.present },
        );
      } else {
        await planningGrilleService.remplacerCellulesPlanning(sejourId, grille.id, cellLigne.id, {
          cellules: [result.payload],
        });
      }
      setCellModalVisible(false);
      setCellLigne(null);
      setCellJour(null);
      await rechargerGrille();
    } catch (e: unknown) {
      setCellError(e instanceof Error ? e.message : 'Enregistrement impossible');
    } finally {
      setCellSubmitting(false);
    }
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

  const libelleLigne = (ligne: PlanningLigneDto): string =>
    grille
      ? libelleLignePourAffichage(ligne, grille, groupes, lieux, horaires, moments, membres, sejour)
      : '';

  const texteCellule = (ligne: PlanningLigneDto, jour: string): string => {
    const cellule = cellulePourJour(ligne, jour);
    return resumeCellule(
      cellule,
      horaires,
      moments,
      groupes,
      lieuxPlanning,
      membres,
      sejour,
      grille ? sourceContenuCellulesEffectif(grille) : undefined,
    );
  };

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

  if (error || !grille) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Planning introuvable.'}</Text>
      </View>
    );
  }

  if (grille.lignes.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Aucun contenu dans ce planning.</Text>
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
    <EcranListeFond>
      <View style={styles.content}>
        <View style={styles.sectionHaut}>
          {grille.consigneGlobale ? (
            <Text style={styles.consigne}>{grille.consigneGlobale}</Text>
          ) : null}

          <View style={styles.barreOutils}>
            <View style={styles.ligneFiltres}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.btnRetour, pressed && styles.btnRetourPressed]}
            accessibilityRole="button"
            accessibilityLabel="Retour à la liste des plannings"
          >
            <Text style={styles.btnRetourTexte}>‹ Retour</Text>
          </Pressable>
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
                  style={[
                    styles.segmentBtnTexte,
                    nombreJoursVue === n && styles.segmentBtnTexteActif,
                  ]}
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
            accessibilityLabel="Jour précédent"
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
            accessibilityLabel="Jour suivant"
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
        </View>

        <ConteneurGrillePaysage modePaysage={modePaysage}>
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.grilleZone}>
            <View style={styles.grille}>
              <EnteteJoursGrille
                joursFenetre={joursFenetre}
                aujourdhui={aujourdhui}
                colonneGauche={
                  afficherColonneLibelle ? (
                    <View style={[styles.celluleLibelle, styles.enteteCoin]} />
                  ) : undefined
                }
              />
              <ScrollView
                style={[styles.grilleScroll, modePaysage && styles.grilleScrollPaysage]}
                contentContainerStyle={styles.grilleScrollContenu}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                }
              >
                {lignesTriees.map((ligne, index) => {
                  const rg = regroupements[index];
                  return (
                    <React.Fragment key={ligne.id}>
                      {rg?.showLeadingCell && rg.libelleRegroupement ? (
                        <View style={styles.sectionEntete}>
                          <Text style={styles.sectionEnteteTexte}>{rg.libelleRegroupement}</Text>
                        </View>
                      ) : null}
                      <View style={styles.ligneDonnees}>
                        {afficherColonneLibelle ? (
                          <View style={[styles.celluleLibelle, styles.celluleLibelleDonnees]}>
                            <Text style={styles.libelleLigneTexte} numberOfLines={4}>
                              {libelleLigne(ligne).trim() || '—'}
                            </Text>
                          </View>
                        ) : null}
                        {joursFenetre.map(({ ymd }, jourIndex) => {
                          const texte = texteCellule(ligne, ymd);
                          const vide = celluleEstVide(texte);
                          const editable = celluleEditable(ligne);
                          const derniereColonne = jourIndex === joursFenetre.length - 1;
                          return (
                            <Pressable
                              key={`${ligne.id}-${ymd}`}
                              onPress={() => ouvrirCellule(ligne, ymd)}
                              disabled={!editable}
                              style={({ pressed }) => [
                                styles.celluleDonnees,
                                styles.celluleJourFlexible,
                                derniereColonne && styles.celluleSansBordureDroite,
                                vide && styles.celluleVide,
                                editable && pressed && styles.cellulePressed,
                              ]}
                            >
                              <Text
                                style={[styles.celluleTexte, vide && styles.celluleTexteVide]}
                                numberOfLines={4}
                              >
                                {texte}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </React.Fragment>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </GestureDetector>
        </ConteneurGrillePaysage>

        <PlanningCelluleModal
        visible={cellModalVisible}
        submitting={cellSubmitting}
        error={cellError}
        detail={grille}
        sejour={sejour}
        ligne={cellLigne}
        jour={cellJour}
        libelleLigne={cellLigne ? libelleLigne(cellLigne) : ''}
        horaires={horaires}
        moments={moments}
        groupes={groupes}
        lieux={lieuxPlanning}
        membres={membres}
        peutGererStructure={peutGererStructure}
        tokenUtilisateur={tokenUtilisateur}
        onFermer={fermerCellule}
        onEnregistrer={handleEnregistrerCellule}
        />
      </View>
    </EcranListeFond>
  );
}

export default function GrilleDetail(props: Props) {
  const { modePaysage, basculerModePaysage } = useModePaysageGrille();

  return (
    <SafeAreaProvider>
      <Header iconName="calendar-alt" title={props.route.params.titre} />
      <GrilleDetailContent
        {...props}
        modePaysage={modePaysage}
        basculerModePaysage={basculerModePaysage}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  sectionHaut: {
    backgroundColor: colors.surface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  consigne: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
    minHeight: 36,
    gap: spacing.sm,
  },
  btnRetour: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnRetourPressed: {
    backgroundColor: colors.background,
  },
  btnRetourTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  segmentVue: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  segmentBtn: {
    minHeight: 36,
    justifyContent: 'center',
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
    color: colors.primary,
  },
  grilleZone: {
    flex: 1,
  },
  grilleScroll: {
    flex: 1,
  },
  grilleScrollPaysage: {
    width: '100%',
    height: '100%',
  },
  grilleScrollContenu: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  grille: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  enteteCoin: {
    backgroundColor: colors.background,
  },
  celluleLibelle: {
    width: LARGEUR_COLONNE_LIBELLE,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.background,
  },
  celluleJourFlexible: {
    flex: 1,
    minWidth: 0,
  },
  celluleSansBordureDroite: {
    borderRightWidth: 0,
  },
  sectionEntete: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionEnteteTexte: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  ligneDonnees: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  celluleLibelleDonnees: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  libelleLigneTexte: {
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
    backgroundColor: '#fafbfc',
  },
  cellulePressed: {
    backgroundColor: colors.primarySoft,
  },
  celluleTexte: {
    fontSize: fontSizes.xs,
    color: colors.text,
    textAlign: 'center',
  },
  celluleTexteVide: {
    color: colors.muted,
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
