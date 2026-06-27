import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';
import { Roboto_400Regular } from '@expo-google-fonts/roboto';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import AvatarProfil from '../../Components/AvatarProfil';
import CompteRenduPleinEcranModal from '../../Components/CompteRenduPleinEcranModal';
import ReunionContenuTipTap from '../../Components/ReunionContenuTipTap';
import GlassPanel from '../../Components/GlassPanel';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserFacingErrorMessage } from '../../helpers/axiosError';
import { rafraichirPhotoProfil } from '../../helpers/rafraichirPhotoProfil';
import { enregistrerDernierSejourVisite } from '../../helpers/dernierSejour';
import { dateVeilleCalendaire, formatTitreCompteRenduAccueil, trouverReunionVeille } from '../../helpers/reunionVeille';
import { estContenuTipTapVide } from '../../helpers/reunionTipTapTexte';
import { formatPeriodeSejour, formatPeriodeSejourCourte } from '../../helpers/sejourPeriode';
import { libelleRoleBadgeProfil } from '../../helpers/libelleRoleProfil';
import { navigationRef } from '../../Navigators/navigationRef';
import { accountService } from '../../services/account.service';
import { sejourService } from '../../services/sejour.service';
import { sejourReunionService } from '../../services/sejour-reunion.service';
import type { ReunionContenuTipTapJson, SejourDTO } from '../../types/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setName as setAnimName } from '../../store/animNameSlice';
import { clearUser } from '../../store/authSlice';
import { clearSejour, setSejourCourant, setSejoursDisponibles } from '../../store/sejourSlice';
import { colors, fonts, fontSizes, radius, spacing } from '../../config/theme';

dayjs.locale('fr');

const AVATAR_SIZE = 100;
const GLASS_INTENSITY = 65;
const HEADER_TOP_OFFSET = 52;
const TITLE_LIFT = 28;

function Home() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const dispatch = useAppDispatch();
  const { prenom, nom, tokenId, role, genre, photoProfilUri, photoProfilRevision } = useAppSelector(
    (state) => state.auth,
  );
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejoursDisponibles = useAppSelector((state) => state.sejour.sejoursDisponibles);

  const [menuOuvert, setMenuOuvert] = useState(false);
  const [crPleinEcranOuvert, setCrPleinEcranOuvert] = useState(false);
  const [sejourEnCoursId, setSejourEnCoursId] = useState<number | null>(null);

  const handleLogout = async () => {
    await accountService.logout();
    dispatch(clearUser());
    dispatch(clearSejour());
    dispatch(setAnimName(''));
    navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const [crTitre, setCrTitre] = useState<string>('Réunion');
  const [crOrdreDuJour, setCrOrdreDuJour] = useState<string>('');
  const [crContenu, setCrContenu] = useState<ReunionContenuTipTapJson | null>(null);
  const [crVide, setCrVide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFocused) {
      setMenuOuvert(false);
      setCrPleinEcranOuvert(false);
    }
  }, [isFocused]);

  const loadAccueil = useCallback(async (estRafraichissement = false) => {
    if (!sejour?.id) {
      setCrTitre('Réunion');
      setCrOrdreDuJour('');
      setCrContenu(null);
      setCrVide(false);
      setError(null);
      if (!estRafraichissement) setLoading(false);
      return;
    }

    if (!estRafraichissement) setLoading(true);
    setError(null);

    try {
      const reunions = await sejourReunionService.listerReunions(sejour.id);
      const reunionVeille = trouverReunionVeille(reunions);
      const veille = dateVeilleCalendaire();

      if (!reunionVeille) {
        setCrTitre('Réunion');
        setCrOrdreDuJour('');
        setCrContenu(null);
        setCrVide(true);
      } else {
        setCrVide(false);
        setCrTitre(formatTitreCompteRenduAccueil(veille));
        setCrOrdreDuJour(reunionVeille.ordreDuJour?.trim() ?? '');
        setCrContenu(reunionVeille.contenu);
      }
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Impossible de charger l’accueil.'));
    } finally {
      if (!estRafraichissement) setLoading(false);
    }
  }, [sejour?.id]);

  useEffect(() => {
    void loadAccueil();
  }, [loadAccueil]);

  const chargerSejoursDisponibles = useCallback(async () => {
    try {
      const list = await sejourService.getAllSejoursByUtilisateur();
      dispatch(setSejoursDisponibles(list));
    } catch {
      /* liste de séjours indisponible : on garde le séjour courant */
    }
  }, [dispatch]);

  useEffect(() => {
    void chargerSejoursDisponibles();
  }, [chargerSejoursDisponibles]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadAccueil(true),
        chargerSejoursDisponibles(),
        rafraichirPhotoProfil().catch(() => {}),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadAccueil, chargerSejoursDisponibles]);

  const handleChoisirSejour = async (cible: SejourDTO) => {
    if (cible.id === sejour?.id) {
      setMenuOuvert(false);
      return;
    }
    setSejourEnCoursId(cible.id);
    try {
      const detail = await sejourService.getSejourById(cible.id);
      dispatch(setSejourCourant(detail));
      if (tokenId) {
        await enregistrerDernierSejourVisite(tokenId, cible.id);
      }
      setMenuOuvert(false);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Impossible de sélectionner ce séjour.'));
    } finally {
      setSejourEnCoursId(null);
    }
  };

  const plusieursSejours = sejoursDisponibles.length > 1;
  const peutChoisirSejour = sejoursDisponibles.length > 0;
  const selecteurSejourActif = peutChoisirSejour && (sejour == null || plusieursSejours);

  const ouvrirProfil = () => {
    if (!sejour) return;
    if (navigationRef.isReady()) {
      navigationRef.navigate('Profil');
    }
  };

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
    Roboto_400Regular,
  });

  const todayDate = dayjs().format('dddd DD MMMM YYYY');
  const periodeSejour = sejour != null ? formatPeriodeSejourCourte(sejour) : null;
  const libelleRoleSurSejour =
    sejour != null ? libelleRoleBadgeProfil(tokenId, genre, role, sejour) : null;
  const peutOuvrirCrGrand =
    !crVide && (crOrdreDuJour.length > 0 || !estContenuTipTapVide(crContenu));

  if (!fontsLoaded || (loading && sejour?.id)) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={colors.surface} />
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, '#2a2d8a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.orbTop} pointerEvents="none" />
      <View style={styles.orbBottom} pointerEvents="none" />

      <Pressable
        style={[styles.logoutBtn, { top: insets.top + spacing.sm }]}
        onPress={() => void handleLogout()}
        hitSlop={12}
        accessibilityLabel="Se déconnecter"
      >
        <Ionicons name="log-out-outline" size={26} color={colors.danger} />
      </Pressable>

      <View
        style={[
          styles.main,
          {
            paddingTop: insets.top + HEADER_TOP_OFFSET,
            paddingBottom: insets.bottom + spacing.md,
          },
        ]}
      >
        <Text style={styles.title}>Enjoy</Text>

        <Pressable
          style={({ pressed }) => [
            styles.sejourDropdown,
            pressed && selecteurSejourActif && styles.dropdownPressed,
          ]}
          onPress={() => setMenuOuvert(true)}
          disabled={!selecteurSejourActif}
          accessibilityRole="button"
          accessibilityLabel={sejour ? 'Changer de séjour' : 'Choisir un séjour'}
        >
          <View style={styles.sejourDropdownRow}>
            {sejour ? (
              <Text style={styles.sejourNom} numberOfLines={1}>
                {sejour.nom}
              </Text>
            ) : (
              <Text style={styles.sejourInvite} numberOfLines={2}>
                Veuillez choisir votre séjour
              </Text>
            )}
            {selecteurSejourActif ? (
              <Ionicons name="chevron-down" size={18} color={colors.surface} />
            ) : null}
          </View>
          {periodeSejour ? <Text style={styles.sejourPeriode}>{periodeSejour}</Text> : null}
        </Pressable>

        <Pressable
          onPress={ouvrirProfil}
          disabled={sejour == null}
          accessibilityRole="button"
          accessibilityLabel={
            sejour ? 'Voir mon profil' : 'Choisissez un séjour pour accéder à votre profil'
          }
          style={[styles.avatarWrap, sejour == null && styles.avatarWrapDesactive]}
        >
          <GlassPanel borderRadius={radius.full} intensity={45} style={styles.avatarRing}>
            <AvatarProfil
              key={`photo-profil-${photoProfilRevision}`}
              prenom={prenom ?? ''}
              nom={nom ?? ''}
              uri={photoProfilUri}
              size={AVATAR_SIZE}
            />
          </GlassPanel>
          {prenom ? (
            <Text style={styles.avatarPrenom} numberOfLines={2}>
              {prenom}
              {libelleRoleSurSejour ? ` (${libelleRoleSurSejour})` : ''}
            </Text>
          ) : null}
        </Pressable>

        <GlassPanel borderRadius={radius.full} intensity={40} style={styles.dateBadge}>
          <Text style={styles.date}>{todayDate}</Text>
        </GlassPanel>

        {sejour ? (
          <GlassPanel
            intensity={GLASS_INTENSITY}
            overlayOpacity={0.42}
            style={styles.reportCard}
            contentStyle={styles.reportCardInner}
          >
            <View style={styles.reportCardHeader}>
              <View style={styles.crHeaderRow}>
                <Text style={styles.crTitle} numberOfLines={2}>{crTitre}</Text>
              </View>
              {peutOuvrirCrGrand ? (
                <Pressable
                  onPress={() => setCrPleinEcranOuvert(true)}
                  hitSlop={10}
                  style={styles.crExpandBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Ouvrir la réunion en plein écran"
                >
                  <Ionicons name="expand-outline" size={22} color={colors.primary} />
                </Pressable>
              ) : null}
              <View style={styles.crDivider} />
            </View>
            <ScrollView
              style={styles.crScroll}
              contentContainerStyle={styles.crScrollContent}
              showsVerticalScrollIndicator
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.danger]}
                  tintColor={colors.primary}
                  progressBackgroundColor={colors.surface}
                />
              }
            >
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {!error && crVide ? (
                <Text style={styles.emptyCr}>Pas de réunion pour hier.</Text>
              ) : null}
              {!error && !crVide && crOrdreDuJour ? (
                <View style={styles.odjBloc}>
                  <Text style={styles.odjLabel}>Ordre du jour</Text>
                  <Text style={styles.odjTexte}>{crOrdreDuJour}</Text>
                </View>
              ) : null}
              {!error && !crVide && !estContenuTipTapVide(crContenu) ? (
                <ReunionContenuTipTap contenu={crContenu} compact />
              ) : null}
              {!error && !crVide && !crOrdreDuJour && estContenuTipTapVide(crContenu) ? (
                <Text style={styles.emptyCr}>Réunion vide.</Text>
              ) : null}
            </ScrollView>
          </GlassPanel>
        ) : null}
      </View>

      <Modal
        visible={menuOuvert && isFocused}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOuvert(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuOuvert(false)}>
          <Pressable onPress={() => {}} style={styles.modalCardWrap}>
            <GlassPanel
              intensity={60}
              overlayOpacity={0.2}
              style={styles.modalGlass}
              contentStyle={styles.modalCardContent}
            >
              <Text style={styles.modalTitle}>Choisir un séjour</Text>
              <FlatList
                data={sejoursDisponibles}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                  const actif = item.id === sejour?.id;
                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.sejourOption,
                        actif && styles.sejourOptionActif,
                        pressed && styles.sejourOptionPressed,
                      ]}
                      onPress={() => void handleChoisirSejour(item)}
                      disabled={sejourEnCoursId !== null}
                    >
                      <View style={styles.sejourOptionTexte}>
                        <Text style={[styles.sejourOptionNom, actif && styles.sejourOptionNomActif]}>
                          {item.nom}
                        </Text>
                        <Text style={styles.sejourOptionPeriode}>{formatPeriodeSejour(item)}</Text>
                      </View>
                      {sejourEnCoursId === item.id ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : actif ? (
                        <View style={styles.sejourOptionCheck}>
                          <Ionicons name="checkmark" size={16} color={colors.surface} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            </GlassPanel>
          </Pressable>
        </Pressable>
      </Modal>

      <CompteRenduPleinEcranModal
        visible={crPleinEcranOuvert && isFocused}
        titre={crTitre}
        ordreDuJour={crOrdreDuJour}
        contenu={crContenu}
        onClose={() => setCrPleinEcranOuvert(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
  },
  orbTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: 120,
    left: -90,
    width: 280,
    height: 280,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  main: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoutBtn: {
    position: 'absolute',
    right: spacing.xl,
    zIndex: 10,
    padding: spacing.xs,
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 64,
    color: colors.surface,
    textAlign: 'center',
    marginTop: spacing.sm - TITLE_LIFT,
    marginBottom: spacing.sm + TITLE_LIFT - spacing.md,
    lineHeight: 76,
    paddingTop: spacing.xs,
  },
  sejourDropdown: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sejourDropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    maxWidth: '100%',
  },
  dropdownPressed: {
    opacity: 0.85,
  },
  sejourNom: {
    fontFamily: fonts.script,
    fontSize: 28,
    color: colors.surface,
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 34,
  },
  sejourInvite: {
    fontFamily: fonts.script,
    fontSize: 24,
    color: colors.surface,
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 30,
  },
  sejourPeriode: {
    fontFamily: fonts.script,
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 22,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarWrapDesactive: {
    opacity: 0.65,
  },
  avatarRing: {
    padding: 5,
  },
  avatarPrenom: {
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.surface,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  dateBadge: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  date: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.surface,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  reportCard: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 140,
  },
  reportCardInner: {
    flex: 1,
  },
  reportCardHeader: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    position: 'relative',
  },
  crScroll: {
    flex: 1,
  },
  crScrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  crHeaderRow: {
    paddingHorizontal: 36,
    marginBottom: spacing.sm,
  },
  crTitle: {
    fontFamily: fonts.body,
    fontWeight: '700',
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: colors.ink,
    textAlign: 'center',
  },
  crExpandBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    padding: spacing.xs,
  },
  crDivider: {
    height: 2,
    backgroundColor: colors.danger,
    opacity: 0.7,
    marginBottom: spacing.sm,
    borderRadius: radius.full,
    width: 48,
    alignSelf: 'center',
  },
  emptyCr: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    lineHeight: 16,
    fontStyle: 'italic',
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  odjBloc: {
    marginBottom: spacing.sm,
  },
  odjLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  odjTexte: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: colors.ink,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  modalCardWrap: {
    width: '100%',
    maxHeight: '70%',
  },
  modalGlass: {
    width: '100%',
    maxHeight: '100%',
  },
  modalCardContent: {
    padding: spacing.xl,
  },
  modalTitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.surface,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  sejourOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  sejourOptionActif: {
    borderColor: colors.danger,
    backgroundColor: colors.primarySoft,
  },
  sejourOptionPressed: {
    opacity: 0.85,
  },
  sejourOptionTexte: {
    flex: 1,
    marginRight: spacing.md,
  },
  sejourOptionNom: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
  },
  sejourOptionNomActif: {
    color: colors.primary,
  },
  sejourOptionPeriode: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  sejourOptionCheck: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontStyle: 'italic',
    fontSize: fontSizes.md,
    color: colors.surface,
    fontFamily: fonts.body,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
});

export default Home;
