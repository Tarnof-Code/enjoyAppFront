import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AvatarProfil from './AvatarProfil';
import PhotoProfilZoomModal from './PhotoProfilZoomModal';
import { colors, fontSizes, radius, spacing } from '../config/theme';

const TAILLE_PHOTO_MODALE = 80;

export function LigneInfoFiche({
  libelle,
  valeur,
  onPress,
}: {
  libelle: string;
  valeur: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.infoLigne}>
      <Text style={styles.infoLibelle}>{libelle}</Text>
      {onPress ? (
        <Text style={[styles.infoValeur, styles.infoValeurLien]} onPress={onPress}>
          {valeur}
        </Text>
      ) : (
        <Text style={styles.infoValeur}>{valeur}</Text>
      )}
    </View>
  );
}

interface FichePersonneModalProps {
  visible: boolean;
  onFermer: () => void;
  prenom: string;
  nom: string;
  sousTitre: string;
  children: React.ReactNode;
  aucuneInfo?: boolean;
  photoUri?: string | null;
}

export default function FichePersonneModal({
  visible,
  onFermer,
  prenom,
  nom,
  sousTitre,
  children,
  aucuneInfo = false,
  photoUri = null,
}: FichePersonneModalProps) {
  const [photoZoomOpen, setPhotoZoomOpen] = useState(false);

  useEffect(() => {
    if (!visible) setPhotoZoomOpen(false);
  }, [visible]);

  const fermer = () => {
    setPhotoZoomOpen(false);
    onFermer();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={fermer}>
      <Pressable style={styles.modalOverlay} onPress={fermer}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <View style={styles.modalEntete}>
            {photoUri ? (
              <Pressable
                onPress={() => setPhotoZoomOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Voir la photo en grand"
              >
                <Image source={{ uri: photoUri }} style={styles.modalPhoto} />
              </Pressable>
            ) : (
              <AvatarProfil prenom={prenom} nom={nom} size={TAILLE_PHOTO_MODALE} />
            )}
            <View style={styles.modalEnteteTexte}>
              <Text style={styles.modalNom}>
                {prenom} {nom.toUpperCase()}
              </Text>
              <Text style={styles.modalRole}>{sousTitre}</Text>
            </View>
          </View>

          <ScrollView style={styles.modalCorps} contentContainerStyle={styles.modalCorpsContenu}>
            {children}
            {aucuneInfo ? (
              <Text style={styles.modalAucuneInfo}>Aucune information complémentaire.</Text>
            ) : null}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [styles.modalFermer, pressed && styles.modalFermerPressed]}
            onPress={fermer}
          >
            <Text style={styles.modalFermerTexte}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
      </Modal>

      <PhotoProfilZoomModal
        visible={visible && photoZoomOpen}
        uri={photoUri}
        onClose={() => setPhotoZoomOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: radius.sm,
    padding: spacing.xl,
  },
  modalEntete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  modalPhoto: {
    width: TAILLE_PHOTO_MODALE,
    height: TAILLE_PHOTO_MODALE,
    borderRadius: TAILLE_PHOTO_MODALE / 2,
    backgroundColor: colors.border,
  },
  modalEnteteTexte: {
    flex: 1,
  },
  modalNom: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  modalRole: {
    marginTop: spacing.xs,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  modalCorps: {
    marginTop: spacing.lg,
  },
  modalCorpsContenu: {
    gap: spacing.md,
  },
  infoLigne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoLibelle: {
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  infoValeur: {
    flexShrink: 1,
    fontSize: fontSizes.sm,
    color: colors.text,
    textAlign: 'right',
  },
  infoValeurLien: {
    color: colors.link,
    fontWeight: '600',
  },
  modalAucuneInfo: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    fontStyle: 'italic',
  },
  modalFermer: {
    marginTop: spacing.xl,
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  modalFermerPressed: {
    backgroundColor: colors.primaryDark,
  },
  modalFermerTexte: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
});
