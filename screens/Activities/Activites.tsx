import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { MultiSelect } from 'react-native-element-dropdown';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import ActiviteConflitSortieModal from '../../Components/ActiviteConflitSortieModal';
import ActiviteEnfantsParticipantsModal from '../../Components/ActiviteEnfantsParticipantsModal';
import ActiviteFormulaireModal, {
  type PayloadEnregistrementActivite,
} from '../../Components/ActiviteFormulaireModal';
import BoutonModePaysageGrille from '../../Components/BoutonModePaysageGrille';
import ConteneurGrillePaysage from '../../Components/ConteneurGrillePaysage';
import EnteteJoursGrille from '../../Components/EnteteJoursGrille';
import { enumererJoursSejour } from '../../helpers/enumererJoursSejour';
import {
  activiteVersUpdateRequest,
  contenuCarteActiviteCellule,
  couleurFondCalendrierPourTypeActivite,
  enfantsEligiblesPourGroupesActivite,
  equipeAvecTokenEnTete,
  groupesFiltreCalendrierActivites,
  idsEnfantsDejaAffectesAutreActivite,
  indexerActivitesParAnimateurEtJour,
  jourActivite,
  jourFocusDefautActivites,
  libellesGroupesReferentParToken,
  ligneCalendrierActiviteEditable,
  peutGererActivitesComplet,
  peutModifierActivite,
} from '../../helpers/activiteUtils';
import {
  cleNonParticipation,
  construireCellulesPlanningParAnimateurEtDate,
  construireSortiesParAnimateurEtDate,
  conflitsSansChoixResolution,
  COULEUR_FOND_CARTE_SORTIE,
  equipeFiltreePourCalendrier,
  estNonParticipation,
  fusionnerNonParticipationsApresChoix,
  idsGroupesCalendrierDepuisValeurs,
  itemPasseFiltreGroupeCalendrier,
  libellePlageHorairePrestataire,
  listerConflitsActiviteInterneAvecSortie,
  sortieVersSaveRequest,
  tokensAnimateursCalendrierDepuisValeurs,
  type CalendrierCelluleItem,
  type ChoixResolutionConflitPrestataire,
  type ConflitActiviteAvecSortie,
} from '../../helpers/activitePrestataireCalendrier';
import {
  aujourdhuiYmd,
  debutFenetrePourJour,
  libelleMembreDansCelluleEquipe,
  membresDirecteurEtEquipe,
  type MembreEquipePlanning,
  type NombreJoursVuePlanning,
} from '../../helpers/planningGrilleUtils';
import { trierEquipeDuSejour } from '../../helpers/triListesSejour';
import { getUserFacingErrorMessage } from '../../helpers/axiosError';
import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import { useFenetreJoursPlanning } from '../../hooks/useFenetreJoursPlanning';
import { useModePaysageGrille } from '../../hooks/useModePaysageGrille';
import { useRafraichirSejourCourant } from '../../hooks/useRafraichirSejourCourant';
import { activiteService } from '../../services/activite.service';
import { activitePrestataireService } from '../../services/activitePrestataire.service';
import { groupeService } from '../../services/groupe.service';
import { lieuService } from '../../services/lieu.service';
import { momentService } from '../../services/moment.service';
import { typeActiviteService } from '../../services/typeActivite.service';
import type {
  ActiviteDto,
  ActivitePrestataireDto,
  CreateActiviteRequest,
  GroupeDto,
  LieuDto,
  MomentDto,
  NonParticipationPrestataireDto,
  TypeActiviteDto,
  UpdateActiviteRequest,
} from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors, fontSizes, radius, spacing } from '../../config/theme';

dayjs.locale('fr');

const LARGEUR_COLONNE_ANIMATEUR = 108;
const SWIPE_SEUIL = 48;

function ActivitesContent({
  modePaysage,
  basculerModePaysage,
}: {
  modePaysage: boolean;
  basculerModePaysage: () => void;
}) {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const tokenUtilisateur = useAppSelector((state) => state.auth.tokenId);
  const sejourId = sejour?.id;

  const [activites, setActivites] = useState<ActiviteDto[]>([]);
  const [prestataires, setPrestataires] = useState<ActivitePrestataireDto[]>([]);
  const [groupes, setGroupes] = useState<GroupeDto[]>([]);
  const [lieux, setLieux] = useState<LieuDto[]>([]);
  const [moments, setMoments] = useState<MomentDto[]>([]);
  const [typesActivite, setTypesActivite] = useState<TypeActiviteDto[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [activiteEditee, setActiviteEditee] = useState<ActiviteDto | null>(null);
  const [cellDate, setCellDate] = useState('');
  const [cellAnimateurTokenId, setCellAnimateurTokenId] = useState<string | null>(null);

  const [enfantsModalVisible, setEnfantsModalVisible] = useState(false);
  const [enfantsModalActivite, setEnfantsModalActivite] = useState<ActiviteDto | null>(null);
  const [enfantsSelection, setEnfantsSelection] = useState<Set<number>>(() => new Set());
  const [enfantsModalChargement, setEnfantsModalChargement] = useState(false);
  const [enfantsModalSubmitting, setEnfantsModalSubmitting] = useState(false);
  const [enfantsModalError, setEnfantsModalError] = useState<string | null>(null);

  const [conflitModalVisible, setConflitModalVisible] = useState(false);
  const [conflitModalError, setConflitModalError] = useState<string | null>(null);
  const [conflitsEnCours, setConflitsEnCours] = useState<ConflitActiviteAvecSortie[]>([]);
  const [choixConflits, setChoixConflits] = useState<Map<string, ChoixResolutionConflitPrestataire>>(
    () => new Map(),
  );
  const [pendingSave, setPendingSave] = useState<PayloadEnregistrementActivite | null>(null);
  const [conflitResolutionEnCours, setConflitResolutionEnCours] = useState<string | null>(null);

  const [animateursSelectionnes, setAnimateursSelectionnes] = useState<string[]>([]);
  const [groupesSelectionnes, setGroupesSelectionnes] = useState<string[]>([]);

  const rafraichirSejour = useRafraichirSejourCourant();

  const executer = useCallback(async () => {
    if (sejourId == null) return;
    const [
      activitesResult,
      prestatairesResult,
      groupesResult,
      lieuxResult,
      momentsResult,
      typesResult,
    ] = await Promise.allSettled([
      activiteService.getActivitesBySejour(sejourId),
      activitePrestataireService.getActivitesPrestatairesBySejour(sejourId).catch(() => []),
      groupeService.getGroupesBySejour(sejourId),
      lieuService.getLieuxBySejour(sejourId).catch(() => []),
      momentService.getMomentsBySejour(sejourId).catch(() => []),
      typeActiviteService.getTypesActiviteBySejour(sejourId).catch(() => []),
      rafraichirSejour(),
    ]);
    if (activitesResult.status === 'rejected') {
      throw activitesResult.reason;
    }
    setActivites(activitesResult.value);
    if (prestatairesResult.status === 'fulfilled') setPrestataires(prestatairesResult.value);
    if (groupesResult.status === 'fulfilled') setGroupes(groupesResult.value);
    if (lieuxResult.status === 'fulfilled') setLieux(lieuxResult.value);
    if (momentsResult.status === 'fulfilled') setMoments(momentsResult.value);
    if (typesResult.status === 'fulfilled') setTypesActivite(typesResult.value);
  }, [sejourId, rafraichirSejour]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les activités.',
  );

  const jours = useMemo(() => {
    if (!sejour) return [];
    return enumererJoursSejour(sejour.dateDebut, sejour.dateFin);
  }, [sejour]);

  const aujourdhui = aujourdhuiYmd();
  const jourFocus = useMemo(() => jourFocusDefautActivites(jours, aujourdhui), [jours, aujourdhui]);

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

  const peutGererComplet = useMemo(
    () => peutGererActivitesComplet(tokenUtilisateur, sejour?.directeur, sejour?.equipe),
    [tokenUtilisateur, sejour],
  );

  const equipe = useMemo(
    () => membresDirecteurEtEquipe(sejour?.directeur, sejour?.equipe, sejour),
    [sejour],
  );

  const equipeTriee = useMemo(
    () => (sejour ? trierEquipeDuSejour(equipe, sejour) : equipe),
    [equipe, sejour],
  );

  const tokenSelf = (tokenUtilisateur ?? '').trim();

  const filtreCalendrierTokens = useMemo(
    () => tokensAnimateursCalendrierDepuisValeurs(animateursSelectionnes),
    [animateursSelectionnes],
  );

  const filtreCalendrierGroupeIds = useMemo(
    () => idsGroupesCalendrierDepuisValeurs(groupesSelectionnes),
    [groupesSelectionnes],
  );

  const equipePourCalendrier = useMemo(
    () =>
      equipeFiltreePourCalendrier({
        equipe: equipeTriee,
        filtreTokens: filtreCalendrierTokens,
        filtreGroupeIds: filtreCalendrierGroupeIds,
        groupes,
        activites,
        tokenPrioritaire: tokenSelf,
        equipeAvecTokenEnTeteFn: equipeAvecTokenEnTete,
      }),
    [
      equipeTriee,
      filtreCalendrierTokens,
      filtreCalendrierGroupeIds,
      groupes,
      activites,
      tokenSelf,
    ],
  );

  const filtresCalendrierActifs =
    animateursSelectionnes.length > 0 || groupesSelectionnes.length > 0;

  const optionsGroupesFiltre = useMemo(
    () =>
      groupesFiltreCalendrierActivites(groupes, tokenSelf).map((g) => ({
        label: g.nom,
        value: String(g.id),
      })),
    [groupes, tokenSelf],
  );

  const equipePourLibellesGrille = useMemo(
    () =>
      equipePourCalendrier.map((m) => ({
        tokenId: m.tokenId,
        prenom: m.prenom,
        nom: m.nom,
      })),
    [equipePourCalendrier],
  );

  const equipePourLibellesFiltre = useMemo(
    () => equipeAvecTokenEnTete(equipeTriee, tokenSelf),
    [equipeTriee, tokenSelf],
  );

  const libelleAnimateurGrille = (membre: MembreEquipePlanning): string =>
    libelleMembreDansCelluleEquipe(membre, equipePourLibellesGrille);

  const optionsAnimateursFiltre = useMemo(() => {
    if (!sejour) return [];
    return equipePourLibellesFiltre.map((m) => ({
      label: libelleMembreDansCelluleEquipe(m, equipePourLibellesFiltre),
      value: m.tokenId,
    }));
  }, [equipePourLibellesFiltre, sejour]);

  const reinitialiserFiltresCalendrier = () => {
    setAnimateursSelectionnes([]);
    setGroupesSelectionnes([]);
  };

  const groupesParId = useMemo(() => new Map(groupes.map((g) => [g.id, g.nom])), [groupes]);

  const libellesReferents = useMemo(() => libellesGroupesReferentParToken(groupes), [groupes]);

  const activitesParAnimateurEtJour = useMemo(
    () =>
      indexerActivitesParAnimateurEtJour(
        activites,
        equipeTriee.map((m) => m.tokenId),
        moments,
      ),
    [activites, equipeTriee, moments],
  );

  const sortiesParAnimateurEtJour = useMemo(
    () => construireSortiesParAnimateurEtDate(prestataires, groupes, moments),
    [prestataires, groupes, moments],
  );

  const cellulesParAnimateurEtJour = useMemo(
    () =>
      construireCellulesPlanningParAnimateurEtDate(
        activitesParAnimateurEtJour,
        sortiesParAnimateurEtJour,
        moments,
        peutGererComplet,
      ),
    [activitesParAnimateurEtJour, sortiesParAnimateurEtJour, moments, peutGererComplet],
  );

  const peutAjouterActivite =
    equipe.length > 0 && groupes.length > 0 && moments.length > 0 && typesActivite.length > 0;

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

  const fermerModal = () => {
    if (modalSubmitting) return;
    setModalVisible(false);
    setActiviteEditee(null);
    setModalError(null);
  };

  const ouvrirCreation = (dateYmd: string, animateurTokenId: string) => {
    if (!peutAjouterActivite) return;
    if (
      !ligneCalendrierActiviteEditable(animateurTokenId, peutGererComplet, tokenUtilisateur)
    ) {
      return;
    }
    setModalError(null);
    setActiviteEditee(null);
    setCellDate(dateYmd);
    setCellAnimateurTokenId(animateurTokenId);
    setModalVisible(true);
  };

  const ouvrirActivite = (activite: ActiviteDto) => {
    setModalError(null);
    setActiviteEditee(activite);
    setCellDate('');
    setCellAnimateurTokenId(null);
    setModalVisible(true);
  };

  const fermerModalEnfants = () => {
    if (enfantsModalSubmitting) return;
    setEnfantsModalVisible(false);
    setEnfantsModalActivite(null);
    setEnfantsModalError(null);
  };

  const ouvrirModalEnfants = () => {
    if (!activiteEditee || sejourId == null) return;
    const activite = activiteEditee;
    setEnfantsModalError(null);
    setEnfantsModalChargement(true);
    setEnfantsModalVisible(true);
    setEnfantsModalActivite(activite);
    setEnfantsSelection(new Set((activite.enfants ?? []).map((e) => e.id)));

    void (async () => {
      try {
        const fraiche = await activiteService.getActiviteById(sejourId, activite.id);
        setEnfantsModalActivite(fraiche);
        setEnfantsSelection(new Set((fraiche.enfants ?? []).map((e) => e.id)));
        setActiviteEditee(fraiche);
      } catch (err: unknown) {
        setEnfantsModalError(
          getUserFacingErrorMessage(err, 'Impossible de charger les enfants participants'),
        );
      } finally {
        setEnfantsModalChargement(false);
      }
    })();
  };

  const toggleEnfantModal = (enfantId: number) => {
    setEnfantsSelection((prev) => {
      const next = new Set(prev);
      if (next.has(enfantId)) next.delete(enfantId);
      else next.add(enfantId);
      return next;
    });
  };

  const enregistrerEnfantsActivite = async () => {
    if (!enfantsModalActivite || sejourId == null) return;
    setEnfantsModalError(null);

    const enfantIds = [...enfantsSelection].sort((a, b) => a - b);
    const momentId = enfantsModalActivite.moment?.id;
    if (momentId != null) {
      const conflits = idsEnfantsDejaAffectesAutreActivite(
        activites,
        jourActivite(enfantsModalActivite),
        momentId,
        moments,
        enfantsModalActivite.id,
      );
      for (const enfantId of enfantIds) {
        const conflit = conflits.get(enfantId);
        if (!conflit) continue;
        const enfant = enfantsEligiblesPourGroupesActivite(
          groupes,
          enfantsModalActivite.groupeIds ?? [],
          sejour,
        ).find((e) => e.id === enfantId);
        const prenom = enfant?.prenom?.trim() || "L'enfant";
        setEnfantsModalError(
          `${prenom} participe déjà à l'activité « ${conflit.activiteNom} » le même jour au moment « ${conflit.momentNom} ».`,
        );
        return;
      }
    }

    setEnfantsModalSubmitting(true);
    try {
      const updated = await activiteService.modifierActivite(
        sejourId,
        enfantsModalActivite.id,
        activiteVersUpdateRequest(enfantsModalActivite, { enfantIds }),
      );
      setActivites((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setActiviteEditee(updated);
      fermerModalEnfants();
    } catch (err: unknown) {
      setEnfantsModalError(
        getUserFacingErrorMessage(err, 'Impossible d’enregistrer les enfants participants'),
      );
    } finally {
      setEnfantsModalSubmitting(false);
    }
  };

  const fermerModalConflit = () => {
    if (modalSubmitting) return;
    setConflitModalVisible(false);
    setConflitModalError(null);
  };

  const fermerApresConflit = () => {
    setModalVisible(false);
    setConflitModalVisible(false);
    setActiviteEditee(null);
    setConflitsEnCours([]);
    setChoixConflits(new Map());
    setPendingSave(null);
    setModalError(null);
    setConflitModalError(null);
  };

  const executerEnregistrementActivite = async (
    result: PayloadEnregistrementActivite,
    conflits: ConflitActiviteAvecSortie[],
    choixParCle: Map<string, ChoixResolutionConflitPrestataire>,
  ) => {
    if (sejourId == null) return;

    const payload = result.payload;
    const membreTokenIds = payload.membreTokenIds;
    const tokensFinaux = new Set(membreTokenIds.map((t) => t.trim()).filter(Boolean));

    for (const c of conflits) {
      const choix = choixParCle.get(cleNonParticipation(c.tokenId, c.momentId));
      if (choix === 'sortie') {
        tokensFinaux.delete(c.tokenId.trim());
      }
    }

    if (tokensFinaux.size === 0) {
      fermerApresConflit();
      Alert.alert(
        result.mode === 'create' ? 'Activité non créée' : 'Modification annulée',
        'La sortie reste affichée sur le calendrier pour le ou les animateurs concernés.',
      );
      return;
    }

    const nonPartsParSortie = new Map<number, NonParticipationPrestataireDto[]>();
    for (const c of conflits) {
      const choix = choixParCle.get(cleNonParticipation(c.tokenId, c.momentId));
      if (choix !== 'activite') continue;
      const sortie = prestataires.find((p) => p.id === c.sortieId);
      if (!sortie) continue;
      const base = nonPartsParSortie.get(c.sortieId) ?? sortie.nonParticipations ?? [];
      const ajouts = c.sortieMomentIds.map((momentId) => ({
        tokenId: c.tokenId,
        momentId,
      }));
      nonPartsParSortie.set(
        c.sortieId,
        fusionnerNonParticipationsApresChoix(base, ajouts, []),
      );
    }

    let prestatairesLocaux = prestataires;
    for (const [sortieId, nonParts] of nonPartsParSortie) {
      const sortie = prestatairesLocaux.find((p) => p.id === sortieId);
      if (!sortie) continue;
      const updated = await activitePrestataireService.modifierActivitePrestataire(
        sejourId,
        sortieId,
        sortieVersSaveRequest(sortie, nonParts),
      );
      prestatairesLocaux = prestatairesLocaux.map((p) => (p.id === updated.id ? updated : p));
    }
    if (nonPartsParSortie.size > 0) {
      setPrestataires(prestatairesLocaux);
    }

    const payloadFinal = {
      ...payload,
      membreTokenIds: [...tokensFinaux],
    };

    if (result.mode === 'create') {
      await activiteService.creerActivite(sejourId, payloadFinal as CreateActiviteRequest);
    } else {
      await activiteService.modifierActivite(
        sejourId,
        result.activiteId,
        payloadFinal as UpdateActiviteRequest,
      );
    }

    fermerApresConflit();
    await refresh();
  };

  const handleEnregistrer = async (result: PayloadEnregistrementActivite) => {
    if (sejourId == null) return;

    const payload = result.payload;
    const momentId = payload.momentId ?? 0;
    const editingId = result.mode === 'update' ? result.activiteId : null;

    const conflits =
      momentId > 0
        ? listerConflitsActiviteInterneAvecSortie(
            payload.date.trim(),
            momentId,
            payload.membreTokenIds,
            prestataires,
            groupes,
            moments,
            activites,
            { exclureActiviteId: editingId },
          )
        : [];

    if (conflits.length > 0) {
      if (!peutGererComplet) {
        setModalError('Une sortie est déjà planifiée sur ce créneau.');
        return;
      }
      setPendingSave(result);
      setConflitsEnCours(conflits);
      setChoixConflits(new Map());
      setConflitModalError(null);
      setConflitModalVisible(true);
      return;
    }

    setModalSubmitting(true);
    setModalError(null);
    try {
      if (result.mode === 'create') {
        await activiteService.creerActivite(sejourId, result.payload);
      } else {
        await activiteService.modifierActivite(sejourId, result.activiteId, result.payload);
      }
      setModalVisible(false);
      setActiviteEditee(null);
      await refresh();
    } catch (err: unknown) {
      setModalError(
        getUserFacingErrorMessage(
          err,
          result.mode === 'create'
            ? 'Impossible de créer l’activité'
            : 'Impossible de modifier l’activité',
        ),
      );
    } finally {
      setModalSubmitting(false);
    }
  };

  const appliquerChoixConflit = (cle: string, choix: ChoixResolutionConflitPrestataire) => {
    setChoixConflits((prev) => {
      const next = new Map(prev);
      next.set(cle, choix);
      return next;
    });
    setConflitModalError(null);
  };

  const confirmerResolutionConflits = async () => {
    if (!pendingSave) return;
    const manquants = conflitsSansChoixResolution(conflitsEnCours, choixConflits);
    if (manquants.length > 0) {
      setConflitModalError(
        manquants.length === 1
          ? 'Choisissez « Afficher la sortie » ou « Créer l’activité » pour l’animateur restant.'
          : `Choisissez une option pour chaque conflit (${manquants.length} sans réponse).`,
      );
      return;
    }
    setModalSubmitting(true);
    setConflitModalError(null);
    try {
      await executerEnregistrementActivite(pendingSave, conflitsEnCours, choixConflits);
    } catch (err: unknown) {
      setConflitModalError(
        getUserFacingErrorMessage(
          err,
          pendingSave.mode === 'create'
            ? 'Impossible de créer l’activité'
            : 'Impossible de modifier l’activité',
        ),
      );
    } finally {
      setModalSubmitting(false);
    }
  };

  const resoudreConflitPrestataire = async (
    item: Extract<CalendrierCelluleItem, { kind: 'conflit' }>,
    tokenId: string,
    choix: ChoixResolutionConflitPrestataire,
  ) => {
    if (sejourId == null) return;
    const tid = tokenId.trim();
    if (!tid) return;

    const sortieCourante = prestataires.find((p) => p.id === item.sortie.id) ?? item.sortie;
    const cleConflit = `conflit-${item.sortie.id}-${item.moment.id}-${tid}`;
    setConflitResolutionEnCours(cleConflit);
    try {
      let nonParts = [...(sortieCourante.nonParticipations ?? [])];
      if (choix === 'sortie') {
        await activiteService.supprimerActivite(sejourId, item.activite.id);
        nonParts = fusionnerNonParticipationsApresChoix(nonParts, [], [
          { tokenId: tid, momentId: item.moment.id },
        ]);
      } else if (!estNonParticipation(nonParts, tid, item.moment.id)) {
        nonParts = fusionnerNonParticipationsApresChoix(
          nonParts,
          [{ tokenId: tid, momentId: item.moment.id }],
          [],
        );
      }
      const updated = await activitePrestataireService.modifierActivitePrestataire(
        sejourId,
        sortieCourante.id,
        sortieVersSaveRequest(sortieCourante, nonParts),
      );
      setPrestataires((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      await refresh();
    } catch (err: unknown) {
      Alert.alert(
        'Erreur',
        getUserFacingErrorMessage(err, 'Impossible de résoudre le conflit sortie / activité'),
      );
    } finally {
      setConflitResolutionEnCours(null);
    }
  };

  const tousChoixConflitsFaits =
    conflitsEnCours.length > 0 &&
    conflitsSansChoixResolution(conflitsEnCours, choixConflits).length === 0;

  const demanderSuppression = () => {
    if (!activiteEditee || sejourId == null) return;
    Alert.alert(
      'Supprimer l’activité',
      `Supprimer « ${activiteEditee.nom} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setModalSubmitting(true);
              setModalError(null);
              try {
                await activiteService.supprimerActivite(sejourId, activiteEditee.id);
                setModalVisible(false);
                setActiviteEditee(null);
                await refresh();
              } catch (err: unknown) {
                setModalError(
                  getUserFacingErrorMessage(err, 'Impossible de supprimer l’activité'),
                );
              } finally {
                setModalSubmitting(false);
              }
            })();
          },
        },
      ],
    );
  };

  if (!sejourId || !sejour) {
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

        {(peutGererComplet && optionsAnimateursFiltre.length > 0) ||
        optionsGroupesFiltre.length > 0 ? (
          <View style={styles.ligneFiltresCalendrier}>
            {peutGererComplet && optionsAnimateursFiltre.length > 0 ? (
              <MultiSelect
                style={styles.filtreDropdown}
                containerStyle={styles.filtreDropdownContainer}
                placeholderStyle={styles.filtreDropdownPlaceholder}
                selectedTextStyle={styles.filtreDropdownPlaceholder}
                itemTextStyle={styles.filtreDropdownItemText}
                activeColor={colors.primarySoft}
                data={optionsAnimateursFiltre}
                labelField="label"
                valueField="value"
                value={animateursSelectionnes}
                onChange={setAnimateursSelectionnes}
                placeholder={
                  animateursSelectionnes.length > 0
                    ? `${animateursSelectionnes.length} anim.`
                    : 'Animateurs'
                }
                visibleSelectedItem={false}
                renderItem={(item, selected) => (
                  <View style={styles.filtreDropdownItem}>
                    <MaterialIcons
                      name={selected ? 'check-box' : 'check-box-outline-blank'}
                      size={18}
                      color={selected ? colors.primary : colors.muted}
                    />
                    <Text style={styles.filtreDropdownItemText} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                )}
              />
            ) : null}
            {optionsGroupesFiltre.length > 0 ? (
              <MultiSelect
                style={styles.filtreDropdown}
                containerStyle={styles.filtreDropdownContainer}
                placeholderStyle={styles.filtreDropdownPlaceholder}
                selectedTextStyle={styles.filtreDropdownPlaceholder}
                itemTextStyle={styles.filtreDropdownItemText}
                activeColor={colors.primarySoft}
                data={optionsGroupesFiltre}
                labelField="label"
                valueField="value"
                value={groupesSelectionnes}
                onChange={setGroupesSelectionnes}
                placeholder={
                  groupesSelectionnes.length > 0
                    ? `${groupesSelectionnes.length} groupe${groupesSelectionnes.length > 1 ? 's' : ''}`
                    : 'Groupes'
                }
                visibleSelectedItem={false}
                renderItem={(item, selected) => (
                  <View style={styles.filtreDropdownItem}>
                    <MaterialIcons
                      name={selected ? 'check-box' : 'check-box-outline-blank'}
                      size={18}
                      color={selected ? colors.primary : colors.muted}
                    />
                    <Text style={styles.filtreDropdownItemText} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                )}
              />
            ) : null}
            {filtresCalendrierActifs ? (
              <Pressable
                onPress={reinitialiserFiltresCalendrier}
                style={({ pressed }) => [
                  styles.btnReinitialiserFiltres,
                  pressed && styles.btnReinitialiserFiltresPressed,
                ]}
              >
                <Text style={styles.btnReinitialiserFiltresTexte}>Réinitialiser</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

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

      {typesActivite.length === 0 ? (
        <Text style={styles.avertissement}>
          Aucun type d’activité disponible pour ce séjour.
        </Text>
      ) : null}
      {moments.length === 0 ? (
        <Text style={styles.avertissement}>
          Aucun moment défini — demandez à la direction d’en configurer avant de planifier.
        </Text>
      ) : null}
      {equipe.length === 0 ? (
        <Text style={styles.avertissement}>Aucun membre d’équipe sur ce séjour.</Text>
      ) : null}
      {equipe.length > 0 && groupes.length === 0 ? (
        <Text style={styles.avertissement}>Aucun groupe — créez-en au moins un pour planifier.</Text>
      ) : null}

      <ConteneurGrillePaysage modePaysage={modePaysage}>
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.grilleZone}>
            {equipePourCalendrier.length === 0 ? (
              <ScrollView
                style={[styles.grilleScroll, modePaysage && styles.grilleScrollPaysage]}
                contentContainerStyle={styles.grilleScrollContenuVide}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                }
              >
                <Text style={styles.empty}>
                  Aucun animateur ne correspond aux filtres sélectionnés.
                </Text>
              </ScrollView>
            ) : (
              <View style={styles.grille}>
                <EnteteJoursGrille
                  joursFenetre={joursFenetre}
                  aujourdhui={aujourdhui}
                  joursSejour={jours}
                  colonneGauche={
                    <View style={[styles.celluleAnimateur, styles.enteteCoin]} />
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
                {equipePourCalendrier.map((membre, indexMembre) => {
                  const ligneEditable = ligneCalendrierActiviteEditable(
                    membre.tokenId,
                    peutGererComplet,
                    tokenUtilisateur,
                  );
                  const libelleReferent = libellesReferents.get(membre.tokenId.trim());
                  const derniereLigne = indexMembre === equipePourCalendrier.length - 1;

                  return (
                    <View
                      key={membre.tokenId}
                      style={[styles.ligneDonnees, derniereLigne && styles.derniereLigne]}
                    >
                      <View style={[styles.celluleAnimateur, styles.celluleAnimateurLibelle]}>
                        <Text style={styles.libelleAnimateurTexte} numberOfLines={3}>
                          {libelleAnimateurGrille(membre)}
                        </Text>
                        {libelleReferent ? (
                          <Text style={styles.libelleReferentTexte} numberOfLines={2}>
                            {libelleReferent}
                          </Text>
                        ) : null}
                      </View>

                      {joursFenetre.map(({ ymd }, jourIndex) => {
                        const brutes =
                          cellulesParAnimateurEtJour.get(membre.tokenId)?.get(ymd) ?? [];
                        const cellule =
                          filtreCalendrierGroupeIds.size === 0
                            ? brutes
                            : brutes.filter((item) =>
                                itemPasseFiltreGroupeCalendrier(item, filtreCalendrierGroupeIds),
                              );
                        const vide = cellule.length === 0;
                        const dansSejour = jours.includes(ymd);
                        const derniereColonne = jourIndex === joursFenetre.length - 1;
                        const peutAjouterCelluleVide =
                          ligneEditable && dansSejour && peutAjouterActivite && vide;
                        const peutAjouterCelluleOccupee =
                          ligneEditable && dansSejour && peutAjouterActivite && !vide;

                        const contenuCellule = (
                          <>
                            {vide && peutAjouterCelluleVide ? (
                              <Text style={styles.celluleAjoutHint}>+</Text>
                            ) : null}
                            {cellule.map((item) => {
                              if (item.kind === 'activite') {
                                const activite = item.activite;
                                const editable = peutModifierActivite(
                                  activite,
                                  peutGererComplet,
                                  tokenUtilisateur,
                                );
                              const carte = contenuCarteActiviteCellule(
                                activite,
                                groupesParId,
                                membre.tokenId,
                                (m) =>
                                  libelleMembreDansCelluleEquipe(
                                    {
                                      tokenId: (m.tokenId ?? '').trim(),
                                      prenom: m.prenom,
                                      nom: m.nom,
                                    },
                                    (activite.membres ?? []).map((x) => ({
                                      tokenId: (x.tokenId ?? '').trim(),
                                      prenom: x.prenom,
                                      nom: x.nom,
                                    })),
                                  ),
                              );
                                return (
                                  <Pressable
                                    key={`act-${activite.id}`}
                                    onPress={() => ouvrirActivite(activite)}
                                    style={({ pressed }) => [
                                      styles.carteActivite,
                                      {
                                        backgroundColor: couleurFondCalendrierPourTypeActivite(
                                          activite.typeActivite?.id,
                                        ),
                                      },
                                      !editable && styles.carteActiviteLectureSeule,
                                      pressed && styles.carteActivitePressed,
                                    ]}
                                  >
                                    {carte.moment ? (
                                      <Text style={styles.carteActiviteMoment} numberOfLines={1}>
                                        {carte.moment}
                                      </Text>
                                    ) : null}
                                    <Text style={styles.carteActiviteNom} numberOfLines={2}>
                                      {carte.nom}
                                    </Text>
                                    {carte.metas.map((ligne, index) => (
                                      <Text
                                        key={`${index}-${ligne}`}
                                        style={styles.carteActiviteMeta}
                                        numberOfLines={2}
                                      >
                                        {ligne}
                                      </Text>
                                    ))}
                                  </Pressable>
                                );
                              }

                              if (item.kind === 'prestataire') {
                                const plage = libellePlageHorairePrestataire(
                                  item.sortie.heureDepart,
                                  item.sortie.heureRetour,
                                );
                                return (
                                  <View
                                    key={`presta-${item.sortie.id}-${item.moment.id}`}
                                    style={[
                                      styles.carteActivite,
                                      styles.carteSortie,
                                      { backgroundColor: COULEUR_FOND_CARTE_SORTIE },
                                    ]}
                                  >
                                    <Text style={styles.carteActiviteMoment} numberOfLines={1}>
                                      {item.moment.nom}
                                    </Text>
                                    <Text style={styles.carteActiviteNom} numberOfLines={2}>
                                      {item.sortie.nom}
                                    </Text>
                                    {plage ? (
                                      <Text style={styles.carteActiviteMeta} numberOfLines={1}>
                                        {plage}
                                      </Text>
                                    ) : null}
                                  </View>
                                );
                              }

                              const cleConflit = `conflit-${item.sortie.id}-${item.moment.id}-${membre.tokenId}`;
                              const enCours = conflitResolutionEnCours === cleConflit;
                              const plage = libellePlageHorairePrestataire(
                                item.sortie.heureDepart,
                                item.sortie.heureRetour,
                              );
                              return (
                                <View key={cleConflit} style={styles.carteConflit}>
                                  <Text style={styles.carteConflitTitre}>
                                    Conflit — {item.moment.nom}
                                  </Text>
                                  <Text style={styles.carteConflitDetail}>
                                    Sortie : {item.sortie.nom}
                                    {plage ? ` (${plage})` : ''}
                                    {'\n'}Activité : {item.activite.nom}
                                  </Text>
                                  {peutGererComplet ? (
                                    <View style={styles.carteConflitActions}>
                                      <Pressable
                                        disabled={enCours}
                                        onPress={() =>
                                          resoudreConflitPrestataire(item, membre.tokenId, 'sortie')
                                        }
                                        style={({ pressed }) => [
                                          styles.btnConflit,
                                          styles.btnConflitPrimaire,
                                          enCours && styles.btnConflitDisabled,
                                          pressed && styles.btnConflitPressed,
                                        ]}
                                      >
                                        <Text style={styles.btnConflitTexte}>Garder la sortie</Text>
                                      </Pressable>
                                      <Pressable
                                        disabled={enCours}
                                        onPress={() =>
                                          resoudreConflitPrestataire(item, membre.tokenId, 'activite')
                                        }
                                        style={({ pressed }) => [
                                          styles.btnConflit,
                                          enCours && styles.btnConflitDisabled,
                                          pressed && styles.btnConflitPressed,
                                        ]}
                                      >
                                        <Text style={styles.btnConflitTexte}>Garder l’activité</Text>
                                      </Pressable>
                                    </View>
                                  ) : (
                                    <Text style={styles.carteConflitHint}>
                                      La direction doit trancher ce conflit.
                                    </Text>
                                  )}
                                </View>
                              );
                            })}
                            {peutAjouterCelluleOccupee ? (
                              <Pressable
                                onPress={() => ouvrirCreation(ymd, membre.tokenId)}
                                style={({ pressed }) => [
                                  styles.btnAjoutMemeCase,
                                  pressed && styles.btnAjoutMemeCasePressed,
                                ]}
                              >
                                <Text style={styles.btnAjoutMemeCaseTexte}>+ Activité</Text>
                              </Pressable>
                            ) : null}
                          </>
                        );

                        if (peutAjouterCelluleVide) {
                          return (
                            <Pressable
                              key={`${membre.tokenId}-${ymd}`}
                              onPress={() => ouvrirCreation(ymd, membre.tokenId)}
                              style={({ pressed }) => [
                                styles.celluleDonnees,
                                styles.celluleJourFlexible,
                                derniereColonne && styles.celluleSansBordureDroite,
                                !dansSejour && styles.celluleHorsSejour,
                                styles.celluleVide,
                                pressed && styles.celluleAjoutPressed,
                              ]}
                            >
                              {contenuCellule}
                            </Pressable>
                          );
                        }

                        return (
                          <View
                            key={`${membre.tokenId}-${ymd}`}
                            style={[
                              styles.celluleDonnees,
                              styles.celluleJourFlexible,
                              derniereColonne && styles.celluleSansBordureDroite,
                              !dansSejour && styles.celluleHorsSejour,
                              vide && styles.celluleVide,
                            ]}
                          >
                            {contenuCellule}
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
                </ScrollView>
              </View>
            )}
          </View>
        </GestureDetector>
      </ConteneurGrillePaysage>

      <ActiviteFormulaireModal
        visible={modalVisible}
        submitting={modalSubmitting}
        error={modalError}
        activite={activiteEditee}
        dateInitiale={activiteEditee ? '' : cellDate}
        animateurTokenIdInitial={activiteEditee ? null : cellAnimateurTokenId}
        sejour={sejour}
        equipe={equipe}
        groupes={groupes}
        lieux={lieux}
        moments={moments}
        typesActivite={typesActivite}
        peutGererComplet={peutGererComplet}
        peutModifier={
          activiteEditee != null &&
          peutModifierActivite(activiteEditee, peutGererComplet, tokenUtilisateur)
        }
        tokenUtilisateur={tokenUtilisateur}
        onFermer={fermerModal}
        onEnregistrer={handleEnregistrer}
        onSupprimer={
          activiteEditee &&
          peutModifierActivite(activiteEditee, peutGererComplet, tokenUtilisateur)
            ? demanderSuppression
            : undefined
        }
        onOuvrirEnfants={activiteEditee ? ouvrirModalEnfants : undefined}
      />

      <ActiviteEnfantsParticipantsModal
        visible={enfantsModalVisible}
        sejour={sejour}
        activite={enfantsModalActivite}
        groupes={groupes}
        activites={activites}
        moments={moments}
        selectedEnfantIds={enfantsSelection}
        chargement={enfantsModalChargement}
        submitting={enfantsModalSubmitting}
        peutModifier={
          enfantsModalActivite != null &&
          peutModifierActivite(enfantsModalActivite, peutGererComplet, tokenUtilisateur)
        }
        error={enfantsModalError}
        onToggleEnfant={toggleEnfantModal}
        onFermer={fermerModalEnfants}
        onEnregistrer={() => {
          void enregistrerEnfantsActivite();
        }}
      />

      <ActiviteConflitSortieModal
        visible={conflitModalVisible}
        submitting={modalSubmitting}
        error={conflitModalError}
        conflits={conflitsEnCours}
        choixParCle={choixConflits}
        modeCreation={pendingSave?.mode === 'create'}
        tousChoixFaits={tousChoixConflitsFaits}
        onAppliquerChoix={appliquerChoixConflit}
        onFermer={fermerModalConflit}
        onConfirmer={() => {
          void confirmerResolutionConflits();
        }}
      />
    </View>
  );
}

export default function Activites() {
  const { modePaysage, basculerModePaysage } = useModePaysageGrille();
  return (
    <ActivitesContent modePaysage={modePaysage} basculerModePaysage={basculerModePaysage} />
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
  ligneFiltresCalendrier: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filtreDropdown: {
    flex: 1,
    minWidth: 120,
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filtreDropdownContainer: {
    borderRadius: radius.sm,
  },
  filtreDropdownPlaceholder: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  filtreDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  filtreDropdownItemText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  btnReinitialiserFiltres: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  btnReinitialiserFiltresPressed: {
    opacity: 0.85,
  },
  btnReinitialiserFiltresTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary,
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
  avertissement: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    fontSize: fontSizes.sm,
    color: colors.actionWarning,
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
  grilleScrollContenuVide: {
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
  celluleAnimateur: {
    width: LARGEUR_COLONNE_ANIMATEUR,
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
  celluleHorsSejour: {
    opacity: 0.5,
  },
  ligneDonnees: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 64,
  },
  derniereLigne: {
    borderBottomWidth: 0,
  },
  celluleAnimateurLibelle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  libelleAnimateurTexte: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.text,
  },
  libelleReferentTexte: {
    marginTop: 2,
    fontSize: 10,
    color: colors.muted,
  },
  celluleDonnees: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    justifyContent: 'flex-start',
    gap: spacing.xs,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    minHeight: 64,
  },
  celluleVide: {
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.65,
  },
  celluleAjoutPressed: {
    backgroundColor: colors.primarySoft,
  },
  celluleAjoutHint: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
  },
  carteActivite: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  carteActiviteLectureSeule: {
    opacity: 0.85,
  },
  carteActivitePressed: {
    opacity: 0.75,
  },
  carteActiviteNom: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  carteActiviteMoment: {
    fontSize: 9,
    color: colors.muted,
    textAlign: 'center',
  },
  carteActiviteMeta: {
    marginTop: 2,
    fontSize: 9,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 12,
  },
  carteSortie: {
    borderColor: colors.success,
  },
  carteConflit: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.actionWarning,
    backgroundColor: colors.warningSoft,
    gap: spacing.xs,
  },
  carteConflitTitre: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.actionWarning,
    textAlign: 'center',
  },
  carteConflitDetail: {
    fontSize: 9,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 12,
  },
  carteConflitHint: {
    fontSize: 8,
    color: colors.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  carteConflitActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  btnConflit: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnConflitPrimaire: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  btnConflitDisabled: {
    opacity: 0.5,
  },
  btnConflitPressed: {
    opacity: 0.75,
  },
  btnConflitTexte: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.text,
  },
  btnAjoutMemeCase: {
    alignSelf: 'center',
    marginTop: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  btnAjoutMemeCasePressed: {
    opacity: 0.75,
  },
  btnAjoutMemeCaseTexte: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
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
