import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { colors, fontSizes, radius, spacing } from '../config/theme';
import {
  cellulePourJour,
  construirePayloadCellule,
  erreurValidationCellulePourContenu,
  groupesParTypePourPlanning,
  normaliserTokenIdsCellule,
  sourceContenuCellulesEffectif,
  type MembreEquipePlanning,
} from '../helpers/planningGrilleUtils';
import { libelleEquipeDuSejour, trierEquipeDuSejour } from '../helpers/triListesSejour';
import type {
  GroupeDto,
  HoraireDto,
  LieuDto,
  MomentDto,
  PlanningCellulePayload,
  PlanningGrilleDetailDto,
  PlanningLigneDto,
  SejourDTO,
} from '../types/api';

dayjs.locale('fr');

const HAUTEUR_FEUILLE_RATIO = 0.92;

export type ResultatEnregistrementCellule =
  | { type: 'cellules'; payload: PlanningCellulePayload }
  | { type: 'ma-presence'; present: boolean };

type PlanningCelluleModalProps = {
  visible: boolean;
  submitting: boolean;
  error: string | null;
  detail: PlanningGrilleDetailDto | null;
  sejour: SejourDTO | null;
  ligne: PlanningLigneDto | null;
  jour: string | null;
  libelleLigne: string;
  horaires: HoraireDto[];
  moments: MomentDto[];
  groupes: GroupeDto[];
  lieux: LieuDto[];
  membres: MembreEquipePlanning[];
  peutGererStructure: boolean;
  tokenUtilisateur: string | null;
  onFermer: () => void;
  onEnregistrer: (result: ResultatEnregistrementCellule) => void;
};

function CaseCocher({
  label,
  checked,
  disabled,
  muted,
  onToggle,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  muted?: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.caseLigne,
        checked && styles.caseLigneSelectionnee,
        disabled && styles.caseLigneDesactivee,
        pressed && !disabled && styles.caseLignePressed,
      ]}
      onPress={onToggle}
      disabled={disabled}
    >
      <MaterialIcons
        name={checked ? 'check-box' : 'check-box-outline-blank'}
        size={22}
        color={disabled ? colors.disabled : checked ? colors.primary : colors.muted}
      />
      <Text style={[styles.caseLabel, muted && styles.caseLabelMuted]}>{label}</Text>
    </Pressable>
  );
}

export default function PlanningCelluleModal({
  visible,
  submitting,
  error,
  detail,
  sejour,
  ligne,
  jour,
  libelleLigne,
  horaires,
  moments,
  groupes,
  lieux,
  membres,
  peutGererStructure,
  tokenUtilisateur,
  onFermer,
  onEnregistrer,
}: PlanningCelluleModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = windowHeight * HAUTEUR_FEUILLE_RATIO;

  const [horaireIds, setHoraireIds] = useState<number[]>([]);
  const [momentIds, setMomentIds] = useState<number[]>([]);
  const [groupeIds, setGroupeIds] = useState<number[]>([]);
  const [lieuIds, setLieuIds] = useState<number[]>([]);
  const [texteLibre, setTexteLibre] = useState('');
  const [membreTokens, setMembreTokens] = useState<string[]>([]);
  const [erreurLocale, setErreurLocale] = useState<string | null>(null);
  const tokensInitiauxRef = useRef<string[]>([]);

  const contenuSrc = detail ? sourceContenuCellulesEffectif(detail) : null;
  const tokenSelf = (tokenUtilisateur ?? '').trim();
  const restrictionsAnimateur =
    visible && !peutGererStructure && contenuSrc === 'MEMBRE_EQUIPE';

  useEffect(() => {
    if (!visible || !ligne || !jour) return;
    const cell = cellulePourJour(ligne, jour);
    setHoraireIds(cell?.horaireIds?.length ? [...cell.horaireIds] : []);
    setMomentIds(cell?.momentIds?.length ? [...cell.momentIds] : []);
    setGroupeIds(cell?.groupeIds?.length ? [...cell.groupeIds] : []);
    setLieuIds(cell?.lieuIds?.length ? [...cell.lieuIds] : []);
    setTexteLibre(cell?.texteLibre ?? '');
    const tokens = normaliserTokenIdsCellule(cell?.membreTokenIds);
    tokensInitiauxRef.current = [...tokens];
    setMembreTokens(tokens);
    setErreurLocale(null);
  }, [visible, ligne, jour]);

  const membresAffichables = useMemo(() => {
    if (!restrictionsAnimateur || !tokenSelf) return membres;
    const tokensTrim = new Set(membreTokens.map((t) => t.trim()));
    const visibles = membres.filter(
      (m) => m.tokenId.trim() === tokenSelf || tokensTrim.has(m.tokenId.trim()),
    );
    if (!visibles.some((m) => m.tokenId.trim() === tokenSelf)) {
      visibles.push({ tokenId: tokenSelf, prenom: 'Vous', nom: '' });
    }
    return trierEquipeDuSejour(visibles, sejour);
  }, [membres, restrictionsAnimateur, tokenSelf, membreTokens, sejour]);

  const groupesParType = useMemo(() => groupesParTypePourPlanning(groupes), [groupes]);
  const momentsTries = useMemo(
    () => moments.slice().sort((a, b) => a.ordre - b.ordre || a.id - b.id),
    [moments],
  );

  const toggleId = (ids: number[], id: number, setter: (v: number[]) => void) => {
    setter(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };

  const toggleMembre = (tokenId: string) => {
    const tid = tokenId.trim();
    if (restrictionsAnimateur && (!tokenSelf || tid !== tokenSelf)) return;
    setMembreTokens((prev) => {
      const idx = prev.findIndex((x) => x.trim() === tid);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      return [...prev, tid];
    });
  };

  const handleEnregistrer = () => {
    if (!detail || !jour || !contenuSrc) return;

    if (restrictionsAnimateur) {
      if (!tokenSelf) {
        setErreurLocale('Impossible de vous identifier. Reconnectez-vous.');
        return;
      }
      const hadSelf = tokensInitiauxRef.current.some((t) => t.trim() === tokenSelf);
      const hasSelf = membreTokens.some((t) => t.trim() === tokenSelf);
      if (hadSelf === hasSelf) {
        onFermer();
        return;
      }
      setErreurLocale(null);
      onEnregistrer({ type: 'ma-presence', present: hasSelf });
      return;
    }

    const payload = construirePayloadCellule(
      jour,
      contenuSrc,
      horaireIds,
      momentIds,
      groupeIds,
      lieuIds,
      texteLibre,
      membreTokens,
    );
    const err = erreurValidationCellulePourContenu(payload, contenuSrc);
    if (err) {
      setErreurLocale(err);
      return;
    }
    setErreurLocale(null);
    onEnregistrer({ type: 'cellules', payload });
  };

  const messageErreur = erreurLocale ?? error;
  const jourLabel = jour ? dayjs(jour).format('dddd D MMMM') : '';
  const enregistrerDesactive =
    submitting || (restrictionsAnimateur && !tokenSelf);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      <View style={styles.root}>
        <Pressable style={styles.zoneFermer} onPress={onFermer} accessibilityLabel="Fermer" />
        <View style={[styles.sheet, { height: sheetHeight, paddingBottom: insets.bottom }]}>
          <View style={styles.entete}>
            <Text style={styles.titre}>Cellule</Text>
            <Text style={styles.meta}>
              {jourLabel}
              {libelleLigne ? ` · ${libelleLigne}` : ''}
            </Text>
          </View>

          <ScrollView style={styles.liste} contentContainerStyle={styles.listeContenu} keyboardShouldPersistTaps="handled">
            {contenuSrc === 'SAISIE_LIBRE' ? (
              <>
                <Text style={styles.champLabel}>Texte libre (optionnel)</Text>
                <TextInput
                  style={styles.textarea}
                  multiline
                  numberOfLines={4}
                  value={texteLibre}
                  onChangeText={setTexteLibre}
                  editable={!submitting}
                  placeholder="Texte affiché dans la cellule…"
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={[styles.champLabel, styles.champLabelSpacing]}>Membres (optionnel)</Text>
                {membres.length === 0 ? (
                  <Text style={styles.hintWarn}>Aucun membre dans l’équipe de ce séjour.</Text>
                ) : (
                  membres.map((m) => (
                    <CaseCocher
                      key={m.tokenId}
                      label={libelleEquipeDuSejour(m, sejour)}
                      checked={membreTokens.some((t) => t.trim() === m.tokenId.trim())}
                      disabled={submitting}
                      onToggle={() => toggleMembre(m.tokenId)}
                    />
                  ))
                )}
              </>
            ) : null}

            {contenuSrc === 'MEMBRE_EQUIPE' ? (
              <>
                <Text style={styles.champLabel}>Membres de l’équipe</Text>
                {restrictionsAnimateur && !tokenSelf ? (
                  <Text style={styles.hintWarn}>Reconnectez-vous pour confirmer votre inscription.</Text>
                ) : null}
                {membres.length === 0 ? (
                  <Text style={styles.hintWarn}>Aucun membre dans l’équipe de ce séjour.</Text>
                ) : (
                  membresAffichables.map((m) => {
                    const lectureSeule =
                      restrictionsAnimateur && (!tokenSelf || m.tokenId.trim() !== tokenSelf);
                    return (
                      <CaseCocher
                        key={m.tokenId}
                        label={libelleEquipeDuSejour(m, sejour) || `${m.prenom} ${m.nom}`.trim()}
                        checked={membreTokens.some((t) => t.trim() === m.tokenId.trim())}
                        disabled={submitting || lectureSeule}
                        muted={lectureSeule}
                        onToggle={() => toggleMembre(m.tokenId)}
                      />
                    );
                  })
                )}
              </>
            ) : null}

            {contenuSrc === 'HORAIRE' ? (
              <>
                <Text style={styles.champLabel}>Horaires</Text>
                {horaires.length === 0 ? (
                  <Text style={styles.hintWarn}>Aucun horaire pour ce séjour.</Text>
                ) : (
                  horaires.map((h) => (
                    <CaseCocher
                      key={h.id}
                      label={h.libelle}
                      checked={horaireIds.includes(h.id)}
                      disabled={submitting}
                      onToggle={() => toggleId(horaireIds, h.id, setHoraireIds)}
                    />
                  ))
                )}
              </>
            ) : null}

            {contenuSrc === 'MOMENT' ? (
              <>
                <Text style={styles.champLabel}>Moments</Text>
                {momentsTries.length === 0 ? (
                  <Text style={styles.hintWarn}>Aucun moment pour ce séjour.</Text>
                ) : (
                  momentsTries.map((m) => (
                    <CaseCocher
                      key={m.id}
                      label={m.nom}
                      checked={momentIds.includes(m.id)}
                      disabled={submitting}
                      onToggle={() => toggleId(momentIds, m.id, setMomentIds)}
                    />
                  ))
                )}
              </>
            ) : null}

            {contenuSrc === 'GROUPE' ? (
              <>
                <Text style={styles.champLabel}>Groupes</Text>
                {groupes.length === 0 ? (
                  <Text style={styles.hintWarn}>Aucun groupe pour ce séjour.</Text>
                ) : (
                  groupesParType.map((bloc) => (
                    <View key={bloc.type} style={styles.blocGroupes}>
                      <Text style={styles.blocGroupesTitre}>{bloc.label}</Text>
                      {bloc.groupes.map((g) => (
                        <CaseCocher
                          key={g.id}
                          label={g.nom}
                          checked={groupeIds.includes(g.id)}
                          disabled={submitting}
                          onToggle={() => toggleId(groupeIds, g.id, setGroupeIds)}
                        />
                      ))}
                    </View>
                  ))
                )}
              </>
            ) : null}

            {contenuSrc === 'LIEU' ? (
              <>
                <Text style={styles.champLabel}>Lieux</Text>
                {lieux.length === 0 ? (
                  <Text style={styles.hintWarn}>
                    Aucun lieu avec usage Surveillance ou Rassemblement.
                  </Text>
                ) : (
                  lieux.map((l) => (
                    <CaseCocher
                      key={l.id}
                      label={l.nom}
                      checked={lieuIds.includes(l.id)}
                      disabled={submitting}
                      onToggle={() => toggleId(lieuIds, l.id, setLieuIds)}
                    />
                  ))
                )}
              </>
            ) : null}
          </ScrollView>

          <View style={styles.pied}>
            {messageErreur ? <Text style={styles.erreur}>{messageErreur}</Text> : null}
            <View style={styles.piedActions}>
              <Pressable
                style={({ pressed }) => [styles.btnSecondaire, pressed && styles.btnPressed]}
                onPress={onFermer}
                disabled={submitting}
              >
                <Text style={styles.btnSecondaireTexte}>Annuler</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.btnPrimaire,
                  (enregistrerDesactive || pressed) && styles.btnPrimairePressed,
                  enregistrerDesactive && styles.btnDesactive,
                ]}
                onPress={handleEnregistrer}
                disabled={enregistrerDesactive}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Text style={styles.btnPrimaireTexte}>Enregistrer</Text>
                )}
              </Pressable>
            </View>
          </View>
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
    width: '100%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: 'hidden',
  },
  entete: {
    flexShrink: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titre: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    marginTop: spacing.xs,
    fontSize: fontSizes.sm,
    color: colors.muted,
    textTransform: 'capitalize',
  },
  liste: {
    flex: 1,
  },
  listeContenu: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
  },
  champLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  champLabelSpacing: {
    marginTop: spacing.lg,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.text,
    minHeight: 96,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  hintWarn: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  caseLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  caseLigneSelectionnee: {
    backgroundColor: colors.primarySoft,
  },
  caseLigneDesactivee: {
    opacity: 0.5,
  },
  caseLignePressed: {
    backgroundColor: colors.background,
  },
  caseLabel: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  caseLabelMuted: {
    color: colors.muted,
  },
  blocGroupes: {
    marginBottom: spacing.md,
  },
  blocGroupesTitre: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  pied: {
    flexShrink: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  erreur: {
    fontSize: fontSizes.sm,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  piedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  btnSecondaire: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaireTexte: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontWeight: '600',
  },
  btnPrimaire: {
    minWidth: 120,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimairePressed: {
    backgroundColor: colors.primaryDark,
  },
  btnDesactive: {
    opacity: 0.5,
  },
  btnPrimaireTexte: {
    fontSize: fontSizes.sm,
    color: colors.surface,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.85,
  },
});
