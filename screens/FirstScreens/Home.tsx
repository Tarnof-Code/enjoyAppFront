import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';
import { Roboto_400Regular } from '@expo-google-fonts/roboto';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { getUserFacingErrorMessage } from '../../helpers/axiosError';
import { enregistrerDernierSejourVisite } from '../../helpers/dernierSejour';
import { dateVeilleCalendaire, trouverReunionVeille } from '../../helpers/reunionVeille';
import { extraireTexteBrutDepuisTipTapJson } from '../../helpers/reunionTipTapTexte';
import { formatPeriodeSejour, formatPeriodeSejourCourte } from '../../helpers/sejourPeriode';
import { navigationRef } from '../../Navigators/BottomTabNavigator';
import { accountService } from '../../services/account.service';
import { sejourService } from '../../services/sejour.service';
import { sejourReunionService } from '../../services/sejour-reunion.service';
import { utilisateurService } from '../../services/utilisateur.service';
import type { SejourDTO } from '../../types/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setName as setAnimName } from '../../store/animNameSlice';
import { clearUser } from '../../store/authSlice';
import { clearSejour, setSejourCourant, setSejoursDisponibles } from '../../store/sejourSlice';
import { colors, fonts, fontSizes, radius, spacing } from '../../config/theme';

dayjs.locale('fr');

function initiales(prenom: string | null, nom: string | null): string {
  const p = prenom?.trim().charAt(0) ?? '';
  const n = nom?.trim().charAt(0) ?? '';
  return (p + n).toUpperCase() || '?';
}

function Home() {
  const dispatch = useAppDispatch();
  const { prenom, nom, tokenId } = useAppSelector((state) => state.auth);
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejoursDisponibles = useAppSelector((state) => state.sejour.sejoursDisponibles);

  const [menuOuvert, setMenuOuvert] = useState(false);
  const [sejourEnCoursId, setSejourEnCoursId] = useState<number | null>(null);

  const handleLogout = async () => {
    await accountService.logout();
    dispatch(clearUser());
    dispatch(clearSejour());
    dispatch(setAnimName(''));
    navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [crTitre, setCrTitre] = useState<string>('Compte rendu');
  const [crCorps, setCrCorps] = useState<string>('');
  const [crVide, setCrVide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccueil = useCallback(async () => {
    if (!sejour?.id) {
      setError('Aucun séjour sélectionné.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (tokenId) {
        const uri = await utilisateurService.getPhotoProfilDataUri(tokenId);
        setPhotoUri(uri);
      }

      const reunions = await sejourReunionService.listerReunions(sejour.id);
      const reunionVeille = trouverReunionVeille(reunions);
      const veilleLabel = dayjs(dateVeilleCalendaire()).format('dddd DD MMMM YYYY');

      if (!reunionVeille) {
        setCrTitre('Compte rendu');
        setCrCorps('');
        setCrVide(true);
      } else {
        setCrVide(false);
        setCrTitre(`Compte rendu du ${veilleLabel}`);
        const parties: string[] = [];
        if (reunionVeille.ordreDuJour?.trim()) {
          parties.push(reunionVeille.ordreDuJour.trim());
        }
        const texte = extraireTexteBrutDepuisTipTapJson(reunionVeille.contenu);
        if (texte) parties.push(texte);
        setCrCorps(parties.join('\n\n'));
      }
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Impossible de charger l’accueil.'));
    } finally {
      setLoading(false);
    }
  }, [sejour?.id, tokenId]);

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

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
    Roboto_400Regular,
  });

  const todayDate = dayjs().format('dddd DD MMM YYYY');
  const periodeSejour = sejour != null ? formatPeriodeSejourCourte(sejour) : null;

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleBox}>
        <View style={styles.titleRow}>
          <Text style={styles.title}> Enjoy</Text>
          {sejour || periodeSejour ? (
            <Pressable
              style={styles.sejourInfo}
              onPress={() => setMenuOuvert(true)}
              disabled={!plusieursSejours}
              accessibilityRole="button"
              accessibilityLabel="Changer de séjour"
            >
              <View style={styles.sejourNomRow}>
                {sejour ? (
                  <Text style={styles.sejourNom} numberOfLines={1}>
                    {sejour.nom}
                  </Text>
                ) : null}
                {plusieursSejours ? (
                  <Ionicons name="chevron-down" size={16} color={colors.primary} style={styles.sejourChevron} />
                ) : null}
              </View>
              {periodeSejour ? <Text style={styles.sejourPeriode}>{periodeSejour}</Text> : null}
            </Pressable>
          ) : (
            <View style={styles.sejourInfo} />
          )}
          <Pressable onPress={() => void handleLogout()} hitSlop={12} accessibilityLabel="Se déconnecter">
            <Ionicons name="log-out-outline" size={26} color={colors.muted} />
          </Pressable>
        </View>

        <Modal
          visible={menuOuvert}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuOuvert(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setMenuOuvert(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
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
                        <Text style={styles.sejourOptionNom}>{item.nom}</Text>
                        <Text style={styles.sejourOptionPeriode}>{formatPeriodeSejour(item)}</Text>
                      </View>
                      {sejourEnCoursId === item.id ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : actif ? (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      </View>

      <View style={styles.welcomeBox}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.image} />
        ) : (
          <View style={styles.initialsCircle}>
            <Text style={styles.initialsText}>{initiales(prenom, nom)}</Text>
          </View>
        )}
        <Text style={styles.welcomeMsg}>Salut {prenom ?? ''} !</Text>
      </View>

      <Text style={styles.date}>{todayDate}</Text>

      <View style={styles.reportOuter}>
        <View style={styles.reportBox}>
          <Text style={styles.crTitle}>{crTitre}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!error && crVide ? (
            <Text style={styles.emptyCr}>Pas de compte rendu pour hier.</Text>
          ) : null}
          {!error && !crVide && crCorps ? (
            <ScrollView style={styles.crScroll}>
              <Text style={styles.text}>{crCorps}</Text>
            </ScrollView>
          ) : null}
          {!error && !crVide && !crCorps ? (
            <Text style={styles.emptyCr}>Compte rendu vide.</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleBox: {
    marginLeft: spacing.xl,
    marginRight: spacing.xl,
    marginTop: 50,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.script,
    fontSize: fontSizes.display,
    color: colors.ink,
  },
  sejourInfo: {
    flex: 1,
    marginHorizontal: spacing.md,
    alignItems: 'center',
  },
  sejourNomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sejourNom: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary,
    flexShrink: 1,
  },
  sejourChevron: {
    marginLeft: spacing.xs,
  },
  sejourPeriode: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  modalCard: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
  },
  modalTitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
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
  },
  sejourOptionActif: {
    borderColor: colors.primary,
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
    color: colors.primary,
  },
  sejourOptionPeriode: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  welcomeBox: {
    marginLeft: 30,
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: radius.full,
  },
  initialsCircle: {
    width: 70,
    height: 70,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: colors.surface,
    fontSize: fontSizes.xxl,
    fontWeight: '700',
  },
  welcomeMsg: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xl,
    marginLeft: spacing.xl,
    color: colors.ink,
  },
  date: {
    textAlign: 'center',
    fontWeight: '900',
    fontSize: fontSizes.lg,
    marginTop: spacing.xl,
    color: colors.ink,
  },
  reportOuter: {
    alignItems: 'center',
    marginTop: 25,
    flex: 1,
  },
  reportBox: {
    borderWidth: 1,
    borderColor: colors.ink,
    minHeight: '65%',
    maxHeight: '75%',
    backgroundColor: colors.surface,
    width: '80%',
    padding: spacing.xl,
    borderRadius: radius.lg,
  },
  crTitle: {
    fontFamily: fonts.body,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: spacing.md,
    color: colors.primary,
    textAlign: 'center',
  },
  crScroll: {
    flex: 1,
  },
  loadingText: {
    marginTop: spacing.md,
    fontStyle: 'italic',
    fontSize: fontSizes.md,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  text: {
    fontSize: fontSizes.sm,
    lineHeight: 22,
    color: colors.text,
  },
  emptyCr: {
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
});

export default Home;
