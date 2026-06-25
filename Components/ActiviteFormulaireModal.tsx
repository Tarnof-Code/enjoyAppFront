import React, { useEffect, useMemo, useState } from 'react';
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
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { colors, fontSizes, radius, spacing } from '../config/theme';
import { idsMomentsSelectionVisuelle, libelleMomentIndente, PAS_INDENT_MOMENT } from '../helpers/construireArbreMoments';
import {
  activiteVersUpdateRequest,
  equipeAvecTokenEnTete,
  groupeIdsDefautActivite,
  jourActivite,
  lieuxPourActivite,
  optionsAvecValeursEnTete,
  tokensAnimateursDefautActivite,
  trierMomentsPourActivite,
  trierTypesActiviteParLibelle,
  valeursEnTeteAvecPrioritaire,
} from '../helpers/activiteUtils';
import { libelleEquipeDuSejour } from '../helpers/triListesSejour';
import type {
  ActiviteDto,
  CreateActiviteRequest,
  GroupeDto,
  LieuDto,
  MomentDto,
  SejourDTO,
  TypeActiviteDto,
  UpdateActiviteRequest,
} from '../types/api';

dayjs.locale('fr');

export type PayloadEnregistrementActivite =
  | { mode: 'create'; payload: CreateActiviteRequest }
  | { mode: 'update'; activiteId: number; payload: UpdateActiviteRequest };

type MembreEquipe = { tokenId: string; nom: string; prenom: string };

type OptionDropdown = { value: string; label: string; profondeur?: number };

type ActiviteFormulaireModalProps = {
  visible: boolean;
  submitting: boolean;
  error: string | null;
  activite: ActiviteDto | null;
  dateInitiale: string;
  animateurTokenIdInitial: string | null;
  sejour: SejourDTO;
  equipe: MembreEquipe[];
  groupes: GroupeDto[];
  lieux: LieuDto[];
  moments: MomentDto[];
  typesActivite: TypeActiviteDto[];
  peutGererComplet: boolean;
  peutModifier: boolean;
  tokenUtilisateur: string | null;
  onFermer: () => void;
  onEnregistrer: (result: PayloadEnregistrementActivite) => void;
  onSupprimer?: () => void;
  onOuvrirEnfants?: () => void;
};

function renderItemDropdown(item: OptionDropdown, selected?: boolean) {
  const profondeur = item.profondeur ?? 0;
  return (
    <View style={[styles.dropdownItem, profondeur > 0 && { paddingLeft: spacing.md + profondeur * PAS_INDENT_MOMENT }]}>
      {selected ? (
        <MaterialIcons name="check" size={18} color={colors.primary} />
      ) : (
        <View style={styles.dropdownItemSpacer} />
      )}
      <Text style={styles.dropdownItemText}>{item.label}</Text>
    </View>
  );
}

export default function ActiviteFormulaireModal({
  visible,
  submitting,
  error,
  activite,
  dateInitiale,
  animateurTokenIdInitial,
  sejour,
  equipe,
  groupes,
  lieux,
  moments,
  typesActivite,
  peutGererComplet,
  peutModifier,
  tokenUtilisateur,
  onFermer,
  onEnregistrer,
  onSupprimer,
  onOuvrirEnfants,
}: ActiviteFormulaireModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(windowHeight * 0.92);

  const tokenSelf = (tokenUtilisateur ?? '').trim();
  const estAnimateurRestreint = !peutGererComplet && tokenSelf !== '';
  const tokenConnecteDansEquipe =
    estAnimateurRestreint && equipe.some((m) => (m.tokenId ?? '').trim() === tokenSelf);

  const [formNom, setFormNom] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMomentId, setFormMomentId] = useState('');
  const [formTypeActiviteId, setFormTypeActiviteId] = useState('');
  const [formLieuId, setFormLieuId] = useState('');
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [selectedGroupeIds, setSelectedGroupeIds] = useState<string[]>([]);
  const [errorLocale, setErrorLocale] = useState<string | null>(null);
  const [modeEdition, setModeEdition] = useState(false);

  const enConsultation = activite != null && !modeEdition;
  const champsDesactives = submitting || enConsultation;

  const momentsTries = useMemo(() => trierMomentsPourActivite(moments), [moments]);
  const typesTries = useMemo(() => trierTypesActiviteParLibelle(typesActivite), [typesActivite]);
  const lieuxActivite = useMemo(() => lieuxPourActivite(lieux), [lieux]);
  const tokenPrioritaireListe = (animateurTokenIdInitial ?? tokenSelf).trim();

  const equipeSelection = useMemo(
    () => equipeAvecTokenEnTete(equipe, tokenPrioritaireListe),
    [equipe, tokenPrioritaireListe],
  );

  const tokensPourOrdreListe = useMemo(() => {
    if (activite) {
      return (activite.membres ?? [])
        .map((m) => (m.tokenId ?? '').trim())
        .filter(Boolean);
    }
    if (selectedTokens.length > 0) return selectedTokens;
    return tokensAnimateursDefautActivite({
      equipe,
      animateurTokenIdInitial,
      tokenSelf,
      estAnimateurRestreint,
      tokenConnecteDansEquipe,
    });
  }, [
    activite,
    selectedTokens,
    equipe,
    animateurTokenIdInitial,
    tokenSelf,
    estAnimateurRestreint,
    tokenConnecteDansEquipe,
  ]);

  const tokensEnTeteListe = useMemo(
    () => valeursEnTeteAvecPrioritaire(tokensPourOrdreListe, tokenPrioritaireListe),
    [tokensPourOrdreListe, tokenPrioritaireListe],
  );

  const groupesPourOrdreListe = useMemo(() => {
    if (activite?.groupeIds?.length) return activite.groupeIds.map(String);
    if (selectedGroupeIds.length > 0) return selectedGroupeIds;
    return groupeIdsDefautActivite({
      groupes,
      equipe,
      animateurTokenIdInitial,
      tokenSelf,
    });
  }, [activite, selectedGroupeIds, groupes, equipe, animateurTokenIdInitial, tokenSelf]);

  const groupesEnTeteListe = groupesPourOrdreListe;

  const optionsMoments = useMemo<OptionDropdown[]>(
    () =>
      momentsTries.map((m) => ({
        value: String(m.id),
        label: libelleMomentIndente(m),
        profondeur: m.profondeur,
      })),
    [momentsTries],
  );

  const optionsTypes = useMemo<OptionDropdown[]>(
    () => typesTries.map((t) => ({ value: String(t.id), label: t.libelle })),
    [typesTries],
  );

  const optionsLieux = useMemo<OptionDropdown[]>(
    () => [
      { value: '', label: '— Aucun —' },
      ...lieuxActivite.map((l) => ({ value: String(l.id), label: l.nom })),
    ],
    [lieuxActivite],
  );

  const optionsGroupes = useMemo<OptionDropdown[]>(
    () =>
      optionsAvecValeursEnTete(
        groupes.map((g) => ({ value: String(g.id), label: g.nom })),
        groupesEnTeteListe,
      ),
    [groupes, groupesEnTeteListe],
  );

  const optionsAnimateurs = useMemo<OptionDropdown[]>(
    () =>
      optionsAvecValeursEnTete(
        equipeSelection.map((m) => ({
          value: (m.tokenId ?? '').trim(),
          label: libelleEquipeDuSejour(m, sejour),
        })),
        tokensEnTeteListe.map((t) => t.trim()),
      ),
    [equipeSelection, sejour, tokensEnTeteListe],
  );

  const momentsSelectionVisuelle = useMemo(() => {
    if (!formMomentId) return new Set<number>();
    const id = Number(formMomentId);
    if (!Number.isFinite(id)) return new Set<number>();
    return idsMomentsSelectionVisuelle(moments, id);
  }, [moments, formMomentId]);

  const renderItemMoment = (item: OptionDropdown, selected?: boolean) => {
    const actifDirect = item.value === formMomentId || selected === true;
    const actifVisuel =
      actifDirect || momentsSelectionVisuelle.has(Number(item.value));
    const herite = actifVisuel && !actifDirect;
    const profondeur = item.profondeur ?? 0;
    return (
      <View
        style={[
          styles.dropdownItem,
          styles.dropdownItemPleineLargeur,
          profondeur > 0 && { paddingLeft: spacing.md + profondeur * PAS_INDENT_MOMENT },
          actifVisuel && styles.dropdownItemActif,
          herite && styles.dropdownItemActifHerite,
        ]}
      >
        {actifVisuel ? (
          <MaterialIcons
            name="check"
            size={18}
            color={herite ? colors.muted : colors.primary}
          />
        ) : (
          <View style={styles.dropdownItemSpacer} />
        )}
        <Text
          style={[
            styles.dropdownItemText,
            actifVisuel && styles.dropdownItemTextActif,
            herite && styles.dropdownItemTextHerite,
          ]}
        >
          {item.label}
        </Text>
      </View>
    );
  };

  const formDate = activite ? jourActivite(activite) : dateInitiale;
  const jourLabel = formDate ? dayjs(formDate).format('dddd D MMMM') : '';

  const remplirFormulaireDepuisActivite = () => {
    if (!activite) return;
    setFormNom(activite.nom);
    setFormDescription(activite.description ?? '');
    setFormMomentId(activite.moment?.id != null ? String(activite.moment.id) : '');
    setFormTypeActiviteId(
      activite.typeActivite?.id != null ? String(activite.typeActivite.id) : '',
    );
    setFormLieuId(activite.lieu?.id != null ? String(activite.lieu.id) : '');
    const tokensEdit = (activite.membres ?? [])
      .map((m) => (m.tokenId ?? '').trim())
      .filter(Boolean);
    if (estAnimateurRestreint && tokenSelf && tokenConnecteDansEquipe && !tokensEdit.includes(tokenSelf)) {
      tokensEdit.push(tokenSelf);
    }
    setSelectedTokens(tokensEdit);
    setSelectedGroupeIds((activite.groupeIds ?? []).map(String));
  };

  useEffect(() => {
    if (!visible) return;
    setErrorLocale(null);
    setModeEdition(activite == null);

    if (activite) {
      remplirFormulaireDepuisActivite();
      return;
    }

    setFormNom('');
    setFormDescription('');
    setFormLieuId('');

    setSelectedGroupeIds(
      groupeIdsDefautActivite({ groupes, equipe, animateurTokenIdInitial, tokenSelf }),
    );
    setSelectedTokens(
      tokensAnimateursDefautActivite({
        equipe,
        animateurTokenIdInitial,
        tokenSelf,
        estAnimateurRestreint,
        tokenConnecteDansEquipe,
      }),
    );

    setFormMomentId(momentsTries.length === 1 ? String(momentsTries[0].id) : '');
    setFormTypeActiviteId(typesTries.length === 1 ? String(typesTries[0].id) : '');
  }, [
    visible,
    activite,
    dateInitiale,
    animateurTokenIdInitial,
    equipe,
    groupes,
    momentsTries,
    typesTries,
    estAnimateurRestreint,
    tokenSelf,
    tokenConnecteDansEquipe,
  ]);

  const handleAnimateursChange = (values: string[]) => {
    let next = values;
    if (estAnimateurRestreint && tokenSelf && tokenConnecteDansEquipe && !next.includes(tokenSelf)) {
      next = [...next, tokenSelf];
    }
    setSelectedTokens(next);
  };

  const handleAnnuler = () => {
    if (activite && modeEdition) {
      remplirFormulaireDepuisActivite();
      setModeEdition(false);
      setErrorLocale(null);
      return;
    }
    onFermer();
  };

  const handleEnregistrer = () => {
    const date = formDate.trim();
    const nom = formNom.trim();
    if (!date) {
      setErrorLocale('La date est obligatoire.');
      return;
    }
    if (!nom) {
      setErrorLocale('Le nom est obligatoire.');
      return;
    }
    if (selectedTokens.length === 0) {
      setErrorLocale('Sélectionnez au moins un animateur.');
      return;
    }
    if (selectedGroupeIds.length === 0) {
      setErrorLocale('Sélectionnez au moins un groupe.');
      return;
    }
    if (!formTypeActiviteId) {
      setErrorLocale('Le type d’activité est obligatoire.');
      return;
    }
    if (optionsMoments.length > 0 && !formMomentId) {
      setErrorLocale('Le moment est obligatoire.');
      return;
    }

    const idsMembres = [...selectedTokens];
    if (estAnimateurRestreint && tokenSelf && tokenConnecteDansEquipe && !idsMembres.includes(tokenSelf)) {
      idsMembres.push(tokenSelf);
    }

    const payloadBase = {
      date,
      nom,
      membreTokenIds: idsMembres,
      groupeIds: selectedGroupeIds.map(Number).sort((a, b) => a - b),
      typeActiviteId: Number(formTypeActiviteId),
      enfantIds:
        activite != null
          ? (activite.enfants ?? []).map((e) => e.id).sort((a, b) => a - b)
          : [],
    };

    const desc = formDescription.trim();
    const payload = {
      ...payloadBase,
      ...(desc ? { description: desc } : activite ? { description: null } : {}),
      ...(formLieuId ? { lieuId: Number(formLieuId) } : activite ? { lieuId: null } : {}),
      ...(formMomentId ? { momentId: Number(formMomentId) } : {}),
    };

    setErrorLocale(null);
    if (activite) {
      onEnregistrer({
        mode: 'update',
        activiteId: activite.id,
        payload: activiteVersUpdateRequest(activite, payload),
      });
    } else {
      onEnregistrer({ mode: 'create', payload: payload as CreateActiviteRequest });
    }
  };

  const messageErreur = errorLocale ?? error;
  const dropdownDisabled = champsDesactives;
  const titreModal =
    activite == null
      ? 'Nouvelle activité'
      : enConsultation
        ? 'Activité'
        : 'Modifier l’activité';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      <View style={styles.root}>
        <Pressable
          style={styles.zoneFermer}
          onPress={() => !submitting && onFermer()}
          accessibilityLabel="Fermer"
        />

        <View style={[styles.sheet, { maxHeight: sheetMaxHeight }]}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContenu,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            <View style={styles.enteteModal}>
              <View style={styles.enteteModalTexte}>
                <Text style={styles.titre}>{titreModal}</Text>
                {jourLabel ? <Text style={styles.meta}>{jourLabel}</Text> : null}
              </View>
              {activite && onOuvrirEnfants ? (
                <Pressable
                  onPress={onOuvrirEnfants}
                  disabled={submitting}
                  accessibilityLabel="Liste enfants participants"
                  style={({ pressed }) => [
                    styles.btnListeEnfants,
                    submitting && styles.btnDisabled,
                    pressed && !submitting && styles.btnPressed,
                  ]}
                >
                  <Text style={styles.btnListeEnfantsTexte}>Liste enfants</Text>
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.label}>
              Nom {!enConsultation ? <Text style={styles.obligatoire}>*</Text> : null}
            </Text>
            <TextInput
              style={[styles.input, enConsultation && styles.inputLectureSeule]}
              value={formNom}
              onChangeText={setFormNom}
              editable={!champsDesactives}
              maxLength={200}
              placeholder="Nom de l’activité"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>
              Moment (créneau){' '}
              {!enConsultation ? <Text style={styles.obligatoire}>*</Text> : null}
            </Text>
            {optionsMoments.length === 0 ? (
              <Text style={styles.hint}>Aucun moment défini pour ce séjour.</Text>
            ) : (
              <Dropdown
                style={[styles.dropdown, enConsultation && styles.dropdownLectureSeule]}
                containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownTexte}
                itemTextStyle={styles.dropdownItemText}
                itemContainerStyle={styles.dropdownItemConteneurTransparent}
                activeColor="transparent"
                disable={dropdownDisabled}
                data={optionsMoments}
                labelField="label"
                valueField="value"
                placeholder="— Choisir un moment —"
                value={formMomentId || null}
                onChange={(item) => setFormMomentId(item.value)}
                renderItem={renderItemMoment}
                flatListProps={{ extraData: formMomentId }}
              />
            )}

            <Text style={styles.label}>
              Type d’activité{' '}
              {!enConsultation ? <Text style={styles.obligatoire}>*</Text> : null}
            </Text>
            {optionsTypes.length === 0 ? (
              <Text style={styles.hint}>Aucun type d’activité disponible.</Text>
            ) : (
              <Dropdown
                style={[styles.dropdown, enConsultation && styles.dropdownLectureSeule]}
                containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownTexte}
                itemTextStyle={styles.dropdownItemText}
                activeColor={colors.primarySoft}
                disable={dropdownDisabled}
                data={optionsTypes}
                labelField="label"
                valueField="value"
                placeholder="— Choisir un type —"
                value={formTypeActiviteId || null}
                onChange={(item) => setFormTypeActiviteId(item.value)}
                renderItem={renderItemDropdown}
              />
            )}

            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textarea, enConsultation && styles.inputLectureSeule]}
              value={formDescription}
              onChangeText={setFormDescription}
              editable={!champsDesactives}
              multiline
              numberOfLines={3}
              maxLength={5000}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Lieu (optionnel)</Text>
            {lieuxActivite.length === 0 ? (
              <Text style={styles.hint}>Aucun lieu activité sur ce séjour.</Text>
            ) : (
              <Dropdown
                style={[styles.dropdown, enConsultation && styles.dropdownLectureSeule]}
                containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownTexte}
                itemTextStyle={styles.dropdownItemText}
                activeColor={colors.primarySoft}
                disable={dropdownDisabled}
                data={optionsLieux}
                labelField="label"
                valueField="value"
                placeholder="— Aucun —"
                value={formLieuId}
                onChange={(item) => setFormLieuId(item.value)}
                renderItem={renderItemDropdown}
              />
            )}

            <Text style={styles.label}>
              Groupes {!enConsultation ? <Text style={styles.obligatoire}>*</Text> : null}
            </Text>
            {optionsGroupes.length === 0 ? (
              <Text style={styles.hint}>Aucun groupe sur ce séjour.</Text>
            ) : (
              <MultiSelect
                style={[styles.dropdown, enConsultation && styles.dropdownLectureSeule]}
                containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownTexte}
                itemTextStyle={styles.dropdownItemText}
                activeColor={colors.primarySoft}
                inverted={false}
                disable={dropdownDisabled}
                data={optionsGroupes}
                labelField="label"
                valueField="value"
                value={selectedGroupeIds}
                onChange={setSelectedGroupeIds}
                placeholder={
                  selectedGroupeIds.length > 0
                    ? `${selectedGroupeIds.length} groupe${selectedGroupeIds.length > 1 ? 's' : ''}`
                    : '— Choisir des groupes —'
                }
                visibleSelectedItem={false}
                renderItem={(item, selected) => (
                  <View style={styles.dropdownItem}>
                    <MaterialIcons
                      name={selected ? 'check-box' : 'check-box-outline-blank'}
                      size={20}
                      color={selected ? colors.primary : colors.muted}
                    />
                    <Text style={styles.dropdownItemText}>{item.label}</Text>
                  </View>
                )}
              />
            )}

            <Text style={styles.label}>
              Animateurs {!enConsultation ? <Text style={styles.obligatoire}>*</Text> : null}
            </Text>
            <MultiSelect
              style={[styles.dropdown, enConsultation && styles.dropdownLectureSeule]}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownTexte}
              itemTextStyle={styles.dropdownItemText}
              activeColor={colors.primarySoft}
              inverted={false}
              flatListProps={{ extraData: tokenPrioritaireListe }}
              disable={dropdownDisabled}
              data={optionsAnimateurs}
              labelField="label"
              valueField="value"
              value={selectedTokens}
              onChange={handleAnimateursChange}
              placeholder={
                selectedTokens.length > 0
                  ? `${selectedTokens.length} animateur${selectedTokens.length > 1 ? 's' : ''}`
                  : '— Choisir des animateurs —'
              }
              visibleSelectedItem={false}
              renderItem={(item, selected) => {
                const lectureSeule =
                  estAnimateurRestreint && tokenSelf !== '' && item.value === tokenSelf;
                return (
                  <View style={[styles.dropdownItem, lectureSeule && styles.dropdownItemMuted]}>
                    <MaterialIcons
                      name={selected ? 'check-box' : 'check-box-outline-blank'}
                      size={20}
                      color={
                        lectureSeule || !selected ? colors.muted : colors.primary
                      }
                    />
                    <Text style={[styles.dropdownItemText, lectureSeule && styles.dropdownItemTextMuted]}>
                      {item.label}
                    </Text>
                  </View>
                );
              }}
            />

            {messageErreur ? <Text style={styles.erreur}>{messageErreur}</Text> : null}

            {enConsultation ? (
              <View style={styles.actions}>
                <Pressable
                  onPress={onFermer}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.btnSecondaire,
                    !peutModifier && styles.btnPleineLargeur,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text style={styles.btnSecondaireTexte}>Fermer</Text>
                </Pressable>
                {peutModifier ? (
                  <Pressable
                    onPress={() => {
                      setErrorLocale(null);
                      setModeEdition(true);
                    }}
                    disabled={submitting}
                    style={({ pressed }) => [styles.btnPrimaire, pressed && styles.btnPressed]}
                  >
                    <Text style={styles.btnPrimaireTexte}>Modifier</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable
                  onPress={handleAnnuler}
                  disabled={submitting}
                  style={({ pressed }) => [styles.btnSecondaire, pressed && styles.btnPressed]}
                >
                  <Text style={styles.btnSecondaireTexte}>Annuler</Text>
                </Pressable>
                <Pressable
                  onPress={handleEnregistrer}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.btnPrimaire,
                    submitting && styles.btnDisabled,
                    pressed && !submitting && styles.btnPressed,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.surface} size="small" />
                  ) : (
                    <Text style={styles.btnPrimaireTexte}>
                      {activite == null ? 'Créer' : 'Enregistrer'}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {activite && modeEdition && onSupprimer ? (
              <Pressable
                onPress={onSupprimer}
                disabled={submitting}
                style={({ pressed }) => [styles.btnDanger, pressed && styles.btnPressed]}
              >
                <Text style={styles.btnDangerTexte}>Supprimer l’activité</Text>
              </Pressable>
            ) : null}
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
    backgroundColor: colors.surface,
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
  enteteModal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  enteteModalTexte: {
    flex: 1,
    minWidth: 0,
  },
  btnListeEnfants: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    marginTop: 2,
  },
  btnListeEnfantsTexte: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  titre: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    textTransform: 'capitalize',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  obligatoire: {
    color: colors.danger,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputLectureSeule: {
    backgroundColor: colors.background,
    color: colors.text,
  },
  textarea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    fontStyle: 'italic',
  },
  dropdown: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dropdownLectureSeule: {
    backgroundColor: colors.background,
    opacity: 1,
  },
  dropdownContainer: {
    borderRadius: radius.sm,
    maxHeight: 280,
  },
  dropdownPlaceholder: {
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  dropdownTexte: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  dropdownItemConteneurTransparent: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dropdownItemPleineLargeur: {
    width: '100%',
  },
  dropdownItemMuted: {
    opacity: 0.85,
  },
  dropdownItemSpacer: {
    width: 18,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  dropdownItemActif: {
    backgroundColor: colors.primarySoft,
  },
  dropdownItemActifHerite: {
    backgroundColor: '#eef0f8',
  },
  dropdownItemTextActif: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  dropdownItemTextHerite: {
    color: colors.text,
    fontWeight: '500',
  },
  dropdownItemTextMuted: {
    color: colors.muted,
  },
  erreur: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btnSecondaire: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  btnSecondaireTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
  },
  btnPleineLargeur: {
    flex: 1,
  },
  btnPrimaire: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  btnPrimaireTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.surface,
  },
  btnDanger: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  btnDangerTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.danger,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
