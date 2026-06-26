import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { getApiErrorMessage, getUserFacingErrorMessage } from '../helpers/axiosError';
import { utilisateurService } from '../services/utilisateur.service';
import { colors, fontSizes, radius, spacing } from '../config/theme';

interface ChangePasswordModalProps {
  visible: boolean;
  tokenId: string;
  onClose: () => void;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&*!]).{4,}$/;

function ChangePasswordModal({ visible, tokenId, onClose }: ChangePasswordModalProps) {
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reinitialiser = () => {
    setAncien('');
    setNouveau('');
    setConfirmation('');
    setError(null);
    setSuccess(false);
    setLoading(false);
  };

  const fermer = () => {
    reinitialiser();
    onClose();
  };

  const valider = async () => {
    if (!ancien.trim() || !nouveau.trim() || !confirmation.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (!PASSWORD_REGEX.test(nouveau)) {
      setError(
        'Le mot de passe doit contenir au moins une minuscule, une majuscule, un caractère spécial (@#$%^&*!) et au moins 4 caractères.',
      );
      return;
    }
    if (nouveau !== confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await utilisateurService.changePassword({
        tokenId,
        ancienMotDePasse: ancien,
        nouveauMotDePasse: nouveau,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: unknown } };
      const message = axiosError.response?.data
        ? getApiErrorMessage(axiosError.response.data, 'Erreur lors du changement de mot de passe')
        : getUserFacingErrorMessage(err, 'Erreur lors du changement de mot de passe');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={fermer}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Modifier mon mot de passe</Text>
            <Pressable onPress={fermer} hitSlop={12} accessibilityLabel="Fermer">
              <Ionicons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>

          {success ? (
            <>
              <Text style={styles.success}>Mot de passe modifié avec succès.</Text>
              <Pressable style={styles.btnPrimary} onPress={fermer}>
                <Text style={styles.btnPrimaryText}>Fermer</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>Ancien mot de passe</Text>
              <TextInput
                style={styles.input}
                value={ancien}
                onChangeText={setAncien}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />

              <Text style={styles.label}>Nouveau mot de passe</Text>
              <TextInput
                style={styles.input}
                value={nouveau}
                onChangeText={setNouveau}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />

              <Text style={styles.label}>Confirmer le nouveau</Text>
              <TextInput
                style={styles.input}
                value={confirmation}
                onChangeText={setConfirmation}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.actions}>
                <Pressable style={styles.btnSecondary} onPress={fermer} disabled={loading}>
                  <Text style={styles.btnSecondaryText}>Annuler</Text>
                </Pressable>
                <Pressable style={styles.btnPrimary} onPress={() => void valider()} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Modifier</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
    fontSize: fontSizes.sm,
  },
  success: {
    color: colors.success,
    fontSize: fontSizes.md,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
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
});

export default ChangePasswordModal;
