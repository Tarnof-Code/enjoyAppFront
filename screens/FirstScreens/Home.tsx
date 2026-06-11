import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { dateVeilleCalendaire, trouverReunionVeille } from '../../helpers/reunionVeille';
import { extraireTexteBrutDepuisTipTapJson } from '../../helpers/reunionTipTapTexte';
import { navigationRef } from '../../Navigators/BottomTabNavigator';
import { accountService } from '../../services/account.service';
import { sejourReunionService } from '../../services/sejour-reunion.service';
import { utilisateurService } from '../../services/utilisateur.service';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setName as setAnimName } from '../../store/animNameSlice';
import { clearUser } from '../../store/authSlice';
import { clearSejour } from '../../store/sejourSlice';

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

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
    Roboto_400Regular,
  });

  const todayDate = dayjs().format('dddd DD MMM YYYY');
  const periodeSejour =
    sejour != null
      ? `${dayjs(sejour.dateDebut).format('DD MMM')} — ${dayjs(sejour.dateFin).format('DD MMM YYYY')}`
      : null;

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#121851" />
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleBox}>
        <View style={styles.titleRow}>
          <Text style={styles.title}> Enjoy</Text>
          <Pressable onPress={() => void handleLogout()} hitSlop={12} accessibilityLabel="Se déconnecter">
            <Ionicons name="log-out-outline" size={26} color="#636e72" />
          </Pressable>
        </View>
        {sejour ? <Text style={styles.sejourNom}>{sejour.nom}</Text> : null}
        {periodeSejour ? <Text style={styles.sejourPeriode}>{periodeSejour}</Text> : null}
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
    backgroundColor: '#f1f2f6',
  },
  titleBox: {
    marginLeft: 20,
    marginRight: 20,
    marginTop: 50,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'DancingScript_400Regular',
    fontSize: 40,
    color: '#000000',
  },
  sejourNom: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 16,
    fontWeight: '600',
    color: '#121851',
    marginTop: 4,
  },
  sejourPeriode: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
    color: '#636e72',
    marginTop: 2,
  },
  welcomeBox: {
    marginLeft: 30,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  initialsCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#121851',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  welcomeMsg: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 20,
    marginLeft: 20,
    color: '#000000',
  },
  date: {
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 18,
    marginTop: 20,
    color: '#000000',
  },
  reportOuter: {
    alignItems: 'center',
    marginTop: 25,
    flex: 1,
  },
  reportBox: {
    borderWidth: 1,
    borderColor: 'black',
    minHeight: '65%',
    maxHeight: '75%',
    backgroundColor: '#ffffff',
    width: '80%',
    padding: 20,
    borderRadius: 40,
  },
  crTitle: {
    fontFamily: 'Roboto_400Regular',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 12,
    color: '#121851',
    textAlign: 'center',
  },
  crScroll: {
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontStyle: 'italic',
    fontSize: 16,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f2f6',
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#2d3436',
  },
  emptyCr: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#636e72',
    textAlign: 'center',
    marginTop: 16,
  },
  error: {
    color: '#F94A56',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Home;
