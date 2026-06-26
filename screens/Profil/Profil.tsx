import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import ChangePasswordModal from '../../Components/ChangePasswordModal';
import PhotoProfilRecadrageModal from '../../Components/PhotoProfilRecadrageModal';
import PhotoProfilZoomModal from '../../Components/PhotoProfilZoomModal';
import type { PhotoRecadreeMobile } from '../../helpers/photoProfilRecadrage';
import { buildUpdateUserRequest } from '../../helpers/buildUpdateUserRequest';
import { canEditEmail, getEmailReadOnlyMessage } from '../../helpers/canEditEmail';
import { getApiErrorMessage, getUserFacingErrorMessage } from '../../helpers/axiosError';
import { parseDateDepuisValeurApi } from '../../helpers/dateApi';
import { libelleRoleBadgeProfil } from '../../helpers/libelleRoleProfil';
import type { RootStackParamList } from '../../Navigators/types';
import { utilisateurService } from '../../services/utilisateur.service';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { bumpPhotoProfilRevision, setPhotoProfilUri, setUserFromProfil } from '../../store/authSlice';
import type { ProfilUtilisateurDTO } from '../../types/api';
import { colors, fontSizes, radius, spacing } from '../../config/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

dayjs.locale('fr');

type ProfilScreenProps = NativeStackScreenProps<RootStackParamList, 'Profil'>;

type ChampEditable =
  | 'prenom'
  | 'nom'
  | 'genre'
  | 'dateNaissance'
  | 'email'
  | 'telephone';

interface ChampConfig {
  cle: ChampEditable | 'motDePasse' | 'dateExpirationCompte';
  label: string;
  icone: keyof typeof FontAwesome5.glyphMap;
  estDate?: boolean;
  estMotDePasse?: boolean;
  lectureSeule?: boolean;
}

const SECTIONS: { titre: string; champs: ChampConfig[] }[] = [
  {
    titre: 'Informations personnelles',
    champs: [
      { cle: 'prenom', label: 'Prénom', icone: 'user' },
      { cle: 'nom', label: 'Nom', icone: 'user' },
      { cle: 'genre', label: 'Genre', icone: 'venus-mars' },
      { cle: 'dateNaissance', label: 'Date de naissance', icone: 'calendar-alt', estDate: true },
    ],
  },
  {
    titre: 'Contact',
    champs: [
      { cle: 'email', label: 'Email', icone: 'envelope' },
      { cle: 'telephone', label: 'N° de téléphone', icone: 'phone' },
    ],
  },
  {
    titre: 'Compte & statut',
    champs: [
      {
        cle: 'dateExpirationCompte',
        label: "Compte valide jusqu'au",
        icone: 'clock',
        estDate: true,
        lectureSeule: true,
      },
      { cle: 'motDePasse', label: 'Mot de passe', icone: 'key', estMotDePasse: true },
    ],
  },
];

function formaterDateAffichage(valeur: string | undefined | null): string {
  const date = parseDateDepuisValeurApi(valeur);
  if (!date) return 'Non renseigné';
  return dayjs(date).format('DD/MM/YYYY');
}

function initiales(prenom: string | null | undefined, nom: string | null | undefined): string {
  const p = prenom?.trim().charAt(0) ?? '';
  const n = nom?.trim().charAt(0) ?? '';
  return (p + n).toUpperCase() || '?';
}

function Profil({ navigation }: ProfilScreenProps) {
  const dispatch = useAppDispatch();
  const { tokenId, role: roleConnecte } = useAppSelector((state) => state.auth);
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);

  const [profil, setProfil] = useState<ProfilUtilisateurDTO | null>(null);
  const [profilInitial, setProfilInitial] = useState<ProfilUtilisateurDTO | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [champEnEdition, setChampEnEdition] = useState<ChampEditable | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deletePhotoModalOpen, setDeletePhotoModalOpen] = useState(false);
  const [photoZoomOpen, setPhotoZoomOpen] = useState(false);
  const [recadrageUri, setRecadrageUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = roleConnecte === 'ADMIN';
  const emailEditable = profil
    ? canEditEmail({ role: roleConnecte, tokenId }, { role: profil.role, tokenId: profil.tokenId })
    : false;
  const emailReadOnlyMessage = getEmailReadOnlyMessage(profil?.role);

  const chargerProfil = useCallback(async () => {
    if (!tokenId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await utilisateurService.getProfilByTokenId(tokenId);
      setProfil(data);
      setProfilInitial(data);

      if (data.photoProfilUrl) {
        const uri = await utilisateurService.getPhotoProfilDataUri(tokenId, Date.now());
        setPhotoUri(uri);
        dispatch(setPhotoProfilUri(uri));
      } else {
        setPhotoUri(null);
        dispatch(setPhotoProfilUri(null));
      }
    } catch (err) {
      setErrorMessage(getUserFacingErrorMessage(err, 'Impossible de charger le profil.'));
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    void chargerProfil();
  }, [chargerProfil]);

  const annulerEdition = () => {
    setProfil(profilInitial);
    setChampEnEdition(null);
    setDatePickerVisible(false);
    setErrorMessage(null);
  };

  const mettreAJourChamp = (cle: keyof ProfilUtilisateurDTO, valeur: string) => {
    setProfil((prev) => (prev ? { ...prev, [cle]: valeur } : prev));
    setErrorMessage(null);
  };

  const validerChamp = async () => {
    if (!profil || !profilInitial || !profil.tokenId) return;

    setSaving(true);
    setErrorMessage(null);
    try {
      const payload = buildUpdateUserRequest({
        tokenId: profil.tokenId,
        prenom: profil.prenom ?? '',
        nom: profil.nom ?? '',
        genre: profil.genre ?? '',
        email: emailEditable ? profil.email ?? '' : profilInitial.email ?? '',
        telephone: profil.telephone ?? '',
        dateNaissance: profil.dateNaissance,
        isAdmin,
        role: isAdmin ? profil.role : undefined,
        dateExpirationCompte: isAdmin ? profil.dateExpirationCompte : undefined,
      });
      await utilisateurService.updateUser(payload);
      setProfilInitial(profil);
      setChampEnEdition(null);
      setDatePickerVisible(false);
      dispatch(
        setUserFromProfil({
          tokenId: profil.tokenId,
          role: String(profil.role),
          prenom: profil.prenom,
          nom: profil.nom,
          genre: profil.genre,
        }),
      );
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number; data?: unknown } };
      const status = axiosError.response?.status;
      const defaultMessage =
        status === 404
          ? 'Utilisateur introuvable'
          : status === 409
            ? "L'email est déjà utilisé par un autre compte."
            : status === 403
              ? 'Accès refusé'
              : 'Erreur lors de la mise à jour du profil';
      const message = axiosError.response?.data
        ? getApiErrorMessage(axiosError.response.data, defaultMessage)
        : getUserFacingErrorMessage(err, defaultMessage);
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const choisirPhoto = async () => {
    if (!profil?.tokenId || photoBusy) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', 'Autorisez l’accès à la galerie pour choisir une photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    setRecadrageUri(result.assets[0].uri);
  };

  const fermerRecadrage = () => {
    if (photoBusy) return;
    setRecadrageUri(null);
  };

  const enregistrerPhotoRecadree = async (photo: PhotoRecadreeMobile) => {
    if (!profil?.tokenId) return;

    setPhotoBusy(true);
    setErrorMessage(null);
    try {
      await utilisateurService.remplacerPhotoProfil(profil.tokenId, {
        uri: photo.uri,
        mimeType: photo.mimeType,
        fileName: photo.fileName,
      });
      const uri = await utilisateurService.getPhotoProfilDataUri(profil.tokenId, Date.now());
      setPhotoUri(uri);
      dispatch(setPhotoProfilUri(uri));
      setProfil((prev) =>
        prev
          ? {
              ...prev,
              photoProfilUrl: `/utilisateurs/${prev.tokenId}/photo-profil`,
            }
          : prev,
      );
      dispatch(bumpPhotoProfilRevision());
      setRecadrageUri(null);
    } catch (err) {
      setErrorMessage(getUserFacingErrorMessage(err, "Erreur lors de l'envoi de la photo."));
      throw err;
    } finally {
      setPhotoBusy(false);
    }
  };

  const confirmerSuppressionPhoto = async () => {
    if (!profil?.tokenId || photoBusy) return;

    setPhotoBusy(true);
    setErrorMessage(null);
    try {
      await utilisateurService.deletePhotoProfil(profil.tokenId);
      setPhotoUri(null);
      dispatch(setPhotoProfilUri(null));
      setProfil((prev) => (prev ? { ...prev, photoProfilUrl: null } : prev));
      setDeletePhotoModalOpen(false);
      dispatch(bumpPhotoProfilRevision());
    } catch (err) {
      setErrorMessage(getUserFacingErrorMessage(err, 'Erreur lors de la suppression de la photo.'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const ouvrirEditionDate = () => {
    if (Platform.OS === 'android') {
      const dateCourante = parseDateDepuisValeurApi(profil?.dateNaissance) ?? new Date();
      DateTimePickerAndroid.open({
        value: dateCourante,
        mode: 'date',
        onChange: (event: DateTimePickerEvent, selected?: Date) => {
          if (event.type === 'dismissed' || !selected) return;
          mettreAJourChamp('dateNaissance', selected.toISOString());
        },
      });
      return;
    }
    setDatePickerVisible(true);
  };

  const roleBadge = profil
    ? libelleRoleBadgeProfil(profil.tokenId, profil.genre, String(profil.role), sejour)
    : '';

  const renderValeur = (champ: ChampConfig) => {
    if (!profil) return null;
    if (champ.estMotDePasse) {
      return <Text style={styles.valeur}>••••••••</Text>;
    }
    if (champ.estDate) {
      const valeur =
        champ.cle === 'dateNaissance'
          ? profil.dateNaissance
          : profil.dateExpirationCompte;
      return <Text style={styles.valeur}>{formaterDateAffichage(valeur)}</Text>;
    }
    const texte = profil[champ.cle as keyof ProfilUtilisateurDTO];
    return (
      <Text style={styles.valeur}>
        {typeof texte === 'string' && texte.trim() !== '' ? texte : 'Non renseigné'}
      </Text>
    );
  };

  const renderEdition = (champ: ChampConfig) => {
    if (!profil || !champEnEdition) return null;

    if (champ.cle === 'genre') {
      return (
        <View style={styles.genreRow}>
          {(['Féminin', 'Masculin'] as const).map((option) => (
            <Pressable
              key={option}
              style={[
                styles.genreBtn,
                profil.genre === option && styles.genreBtnActif,
              ]}
              onPress={() => mettreAJourChamp('genre', option)}
            >
              <Text
                style={[
                  styles.genreBtnTexte,
                  profil.genre === option && styles.genreBtnTexteActif,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      );
    }

    if (champ.estDate && champ.cle === 'dateNaissance') {
      return (
        <View>
          <Pressable style={styles.dateBtn} onPress={ouvrirEditionDate}>
            <Text style={styles.dateBtnTexte}>{formaterDateAffichage(profil.dateNaissance)}</Text>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          </Pressable>
          {Platform.OS === 'ios' && datePickerVisible ? (
            <DateTimePicker
              value={parseDateDepuisValeurApi(profil.dateNaissance) ?? new Date()}
              mode="date"
              display="compact"
              locale="fr-FR"
              onChange={(event, selected) => {
                if (event.type === 'dismissed' || !selected) {
                  setDatePickerVisible(false);
                  return;
                }
                mettreAJourChamp('dateNaissance', selected.toISOString());
              }}
            />
          ) : null}
        </View>
      );
    }

    const valeur = String(profil[champ.cle as keyof ProfilUtilisateurDTO] ?? '');
    return (
      <TextInput
        style={styles.input}
        value={valeur}
        onChangeText={(texte) => mettreAJourChamp(champ.cle as keyof ProfilUtilisateurDTO, texte)}
        autoFocus
        keyboardType={champ.cle === 'telephone' ? 'phone-pad' : 'default'}
        autoCapitalize={champ.cle === 'email' ? 'none' : 'sentences'}
      />
    );
  };

  const peutModifierChamp = (champ: ChampConfig): boolean => {
    if (champ.lectureSeule && !isAdmin) return false;
    if (champ.cle === 'email' && !emailEditable) return false;
    if (champ.estMotDePasse) return true;
    return true;
  };

  const demarrerEdition = (champ: ChampConfig) => {
    if (champ.estMotDePasse) {
      setPasswordModalOpen(true);
      return;
    }
    if (!peutModifierChamp(champ)) return;
    setChampEnEdition(champ.cle as ChampEditable);
    setErrorMessage(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingBox}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.btnRetour, pressed && styles.btnRetourPressed]}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Text style={styles.btnRetourTexte}>‹ Retour</Text>
        </Pressable>
        <Text style={styles.pageTitle}>Mon profil</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.photoCard}>
          <View style={styles.avatarWrap}>
            {photoUri ? (
              <Pressable
                onPress={() => setPhotoZoomOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Voir la photo en grand"
              >
                <Image source={{ uri: photoUri }} style={styles.avatar} />
              </Pressable>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {initiales(profil?.prenom, profil?.nom)}
                </Text>
              </View>
            )}
            <Pressable
              style={[styles.cameraBtn, photoBusy && styles.btnDisabled]}
              onPress={() => void choisirPhoto()}
              disabled={photoBusy}
              accessibilityLabel="Modifier la photo"
            >
              {photoBusy ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <FontAwesome5 name="camera" size={14} color={colors.surface} />
              )}
            </Pressable>
          </View>

          {photoUri ? (
            <Pressable
              style={styles.deletePhotoBtn}
              onPress={() => setDeletePhotoModalOpen(true)}
              disabled={photoBusy}
            >
              <FontAwesome5 name="trash" size={14} color={colors.danger} />
              <Text style={styles.deletePhotoTexte}>Supprimer la photo</Text>
            </Pressable>
          ) : null}

          {roleBadge ? (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeTexte}>{roleBadge}</Text>
            </View>
          ) : null}
        </View>

        {SECTIONS.map((section) => (
          <View key={section.titre} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.titre}</Text>
            {section.champs.map((champ) => {
              const enEdition = champEnEdition === champ.cle;
              const lectureSeule =
                champ.lectureSeule && !isAdmin
                  ? true
                  : champ.cle === 'email' && !emailEditable;

              return (
                <View key={champ.cle} style={[styles.ligne, enEdition && styles.ligneEdition]}>
                  <View style={styles.iconBubble}>
                    <FontAwesome5 name={champ.icone} size={14} color={colors.primary} />
                  </View>
                  <View style={styles.ligneContenu}>
                    <Text style={styles.label}>{champ.label}</Text>
                    {enEdition && !champ.estMotDePasse ? renderEdition(champ) : renderValeur(champ)}
                    {champ.cle === 'email' && lectureSeule && emailReadOnlyMessage ? (
                      <Text style={styles.hint}>{emailReadOnlyMessage}</Text>
                    ) : null}
                  </View>
                  {!lectureSeule ? (
                    <View style={styles.ligneActions}>
                      {enEdition && !champ.estMotDePasse ? (
                        <>
                          <Pressable
                            style={styles.btnSave}
                            onPress={() => void validerChamp()}
                            disabled={saving}
                            accessibilityLabel="Valider"
                          >
                            {saving ? (
                              <ActivityIndicator size="small" color={colors.surface} />
                            ) : (
                              <FontAwesome5 name="check" size={14} color={colors.surface} />
                            )}
                          </Pressable>
                          <Pressable
                            style={styles.btnCancel}
                            onPress={annulerEdition}
                            disabled={saving}
                            accessibilityLabel="Annuler"
                          >
                            <FontAwesome5 name="times" size={14} color={colors.danger} />
                          </Pressable>
                        </>
                      ) : (
                        <Pressable
                          style={styles.btnEdit}
                          onPress={() => demarrerEdition(champ)}
                          accessibilityLabel="Modifier"
                        >
                          <FontAwesome5 name="pencil-alt" size={14} color={colors.actionEdit} />
                        </Pressable>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      </ScrollView>

      <PhotoProfilRecadrageModal
        visible={recadrageUri != null}
        imageUri={recadrageUri}
        onClose={fermerRecadrage}
        onSave={enregistrerPhotoRecadree}
        saving={photoBusy}
      />

      <PhotoProfilZoomModal
        visible={photoZoomOpen}
        uri={photoUri}
        onClose={() => setPhotoZoomOpen(false)}
      />

      <ChangePasswordModal
        visible={passwordModalOpen}
        tokenId={profil?.tokenId ?? ''}
        onClose={() => setPasswordModalOpen(false)}
      />

      <Modal
        visible={deletePhotoModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !photoBusy && setDeletePhotoModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Supprimer la photo de profil</Text>
            <Text style={styles.modalBody}>Voulez-vous vraiment supprimer votre photo de profil ?</Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.btnSecondary}
                onPress={() => setDeletePhotoModalOpen(false)}
                disabled={photoBusy}
              >
                <Text style={styles.btnSecondaryText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={styles.btnDanger}
                onPress={() => void confirmerSuppressionPhoto()}
                disabled={photoBusy}
              >
                {photoBusy ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.btnPrimaryText}>Confirmer</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  btnRetour: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  btnRetourPressed: {
    opacity: 0.7,
  },
  btnRetourTexte: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  pageTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  topBarSpacer: {
    width: 60,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  photoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: radius.full,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.surface,
    fontSize: fontSizes.display,
    fontWeight: '700',
  },
  cameraBtn: {
    position: 'absolute',
    right: -4,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  deletePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  deletePhotoTexte: {
    color: colors.danger,
    fontSize: fontSizes.sm,
  },
  roleBadge: {
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  roleBadgeTexte: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: fontSizes.sm,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ligneEdition: {
    backgroundColor: colors.background,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  ligneContenu: {
    flex: 1,
  },
  label: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginBottom: 2,
  },
  valeur: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  hint: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: fontSizes.md,
    color: colors.text,
    marginTop: spacing.xs,
  },
  genreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  genreBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  genreBtnActif: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  genreBtnTexte: {
    color: colors.text,
    fontSize: fontSizes.sm,
  },
  genreBtnTexteActif: {
    color: colors.primary,
    fontWeight: '600',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  dateBtnTexte: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  ligneActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  btnEdit: {
    padding: spacing.sm,
  },
  btnSave: {
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minWidth: 34,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minWidth: 34,
    alignItems: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalBody: {
    fontSize: fontSizes.md,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  btnSecondary: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryText: {
    color: colors.text,
  },
  btnDanger: {
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.surface,
    fontWeight: '600',
  },
});

export default Profil;
