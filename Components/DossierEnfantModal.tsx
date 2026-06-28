import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LigneInfoFiche } from './FichePersonneModal';
import { colors, fontSizes, radius, spacing } from '../config/theme';
import { getUserFacingErrorMessage } from '../helpers/axiosError';
import { libelleEnfantDuSejour } from '../helpers/triListesSejour';
import { dossierEnfantService } from '../services/dossierEnfant.service';
import type {
  DossierEnfantDto,
  EnfantDossierSanitaireLigneDto,
  ReferenceAlimentaireDto,
  SejourDTO,
} from '../types/api';

type DossierEnfantModalProps = {
  visible: boolean;
  sejour: SejourDTO;
  ligne: EnfantDossierSanitaireLigneDto | null;
  onFermer: () => void;
};

function formatValue(value: string | null | undefined): string {
  return value?.trim() ? value.trim() : '—';
}

function formatReferencesLine(refs: ReferenceAlimentaireDto[] | undefined): string {
  const list = refs ?? [];
  if (!list.length) return '—';
  return [...list]
    .sort((a, b) => a.ordre - b.ordre || a.id - b.id)
    .map((r) => r.libelle)
    .join(', ');
}

function SectionTitre({ titre }: { titre: string }) {
  return <Text style={styles.sectionTitre}>{titre}</Text>;
}

export default function DossierEnfantModal({
  visible,
  sejour,
  ligne,
  onFermer,
}: DossierEnfantModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(windowHeight * 0.92);

  const [dossier, setDossier] = useState<DossierEnfantDto | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !ligne) {
      setDossier(null);
      setErreur(null);
      return;
    }
    let cancelled = false;
    setChargement(true);
    setErreur(null);
    void (async () => {
      try {
        const frais = await dossierEnfantService.getDossierEnfant(sejour.id, ligne.enfantId);
        if (!cancelled) setDossier(frais);
      } catch (err: unknown) {
        if (!cancelled) {
          setErreur(getUserFacingErrorMessage(err, 'Impossible de charger le dossier'));
        }
      } finally {
        if (!cancelled) setChargement(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, ligne, sejour.id]);

  const groupesLabel = ligne?.groupes.map((g) => g.libelle).filter(Boolean).join(', ') ?? '';
  const enfantNom = ligne ? libelleEnfantDuSejour(ligne, sejour) : '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      <View style={styles.root}>
        <Pressable style={styles.zoneFermer} onPress={onFermer} />
        <View style={[styles.sheet, { maxHeight: sheetMaxHeight, paddingBottom: insets.bottom }]}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContenu}>
            <Text style={styles.titre}>Dossier sanitaire</Text>
            {enfantNom ? <Text style={styles.sousTitre}>{enfantNom}</Text> : null}
            {groupesLabel ? <Text style={styles.groupes}>{groupesLabel}</Text> : null}

            {chargement ? (
              <ActivityIndicator color={colors.primary} style={styles.chargement} />
            ) : erreur ? (
              <Text style={styles.erreur}>{erreur}</Text>
            ) : dossier ? (
              <>
                <View style={styles.section}>
                  <SectionTitre titre="Contacts parents" />
                  {dossier.telephoneParent1 ? (
                    <LigneInfoFiche
                      libelle="Tél. parent 1"
                      valeur={formatValue(dossier.telephoneParent1)}
                      onPress={() => Linking.openURL(`tel:${dossier.telephoneParent1}`)}
                    />
                  ) : (
                    <LigneInfoFiche libelle="Tél. parent 1" valeur={formatValue(dossier.telephoneParent1)} />
                  )}
                  {dossier.emailParent1 ? (
                    <LigneInfoFiche
                      libelle="E-mail parent 1"
                      valeur={formatValue(dossier.emailParent1)}
                      onPress={() => Linking.openURL(`mailto:${dossier.emailParent1}`)}
                    />
                  ) : (
                    <LigneInfoFiche libelle="E-mail parent 1" valeur={formatValue(dossier.emailParent1)} />
                  )}
                  {dossier.telephoneParent2 ? (
                    <LigneInfoFiche
                      libelle="Tél. parent 2"
                      valeur={formatValue(dossier.telephoneParent2)}
                      onPress={() => Linking.openURL(`tel:${dossier.telephoneParent2}`)}
                    />
                  ) : (
                    <LigneInfoFiche libelle="Tél. parent 2" valeur={formatValue(dossier.telephoneParent2)} />
                  )}
                  {dossier.emailParent2 ? (
                    <LigneInfoFiche
                      libelle="E-mail parent 2"
                      valeur={formatValue(dossier.emailParent2)}
                      onPress={() => Linking.openURL(`mailto:${dossier.emailParent2}`)}
                    />
                  ) : (
                    <LigneInfoFiche libelle="E-mail parent 2" valeur={formatValue(dossier.emailParent2)} />
                  )}
                </View>

                <View style={styles.section}>
                  <SectionTitre titre="Informations médicales" />
                  <LigneInfoFiche
                    libelle="Infos médicales"
                    valeur={formatValue(dossier.informationsMedicales)}
                  />
                  <LigneInfoFiche libelle="PAI" valeur={formatValue(dossier.pai)} />
                  <LigneInfoFiche libelle="Allergènes" valeur={formatReferencesLine(dossier.allergenes)} />
                  <LigneInfoFiche
                    libelle="Régimes & préférences"
                    valeur={formatReferencesLine(dossier.regimesEtPreferences)}
                  />
                  <LigneInfoFiche
                    libelle="Infos alimentaires"
                    valeur={formatValue(dossier.informationsAlimentaires)}
                  />
                </View>

                <View style={styles.section}>
                  <SectionTitre titre="Traitements" />
                  <LigneInfoFiche libelle="Matin" valeur={formatValue(dossier.traitementMatin)} />
                  <LigneInfoFiche libelle="Midi" valeur={formatValue(dossier.traitementMidi)} />
                  <LigneInfoFiche libelle="Soir" valeur={formatValue(dossier.traitementSoir)} />
                  <LigneInfoFiche libelle="Si besoin" valeur={formatValue(dossier.traitementSiBesoin)} />
                </View>

                <View style={styles.section}>
                  <SectionTitre titre="Autres informations" />
                  <LigneInfoFiche
                    libelle="Autres informations"
                    valeur={formatValue(dossier.autresInformations)}
                  />
                  <LigneInfoFiche
                    libelle="À prendre en sortie"
                    valeur={formatValue(dossier.aPrendreEnSortie)}
                  />
                </View>
              </>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.btnFermer, pressed && styles.btnPressed]}
              onPress={onFermer}
            >
              <Text style={styles.btnFermerTexte}>Fermer</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  zoneFermer: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContenu: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  titre: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  sousTitre: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
  },
  groupes: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  sectionTitre: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.info,
    marginBottom: spacing.xs,
  },
  chargement: {
    marginVertical: spacing.lg,
  },
  erreur: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
  },
  btnFermer: {
    marginTop: spacing.lg,
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  btnFermerTexte: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
