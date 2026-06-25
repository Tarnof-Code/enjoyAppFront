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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, radius, spacing } from '../config/theme';
import {
  analyserModificationChambreIncompatible,
  modificationChambreBloquee,
  type MembreEquipePourChambre,
} from '../helpers/chambreOccupantsUtils';
import type {
  ChambreDto,
  EnfantDto,
  GenreChambre,
  GroupeDto,
  SaveChambreRequest,
  TypeChambre,
} from '../types/api';

const TYPES_CHAMBRE: { value: TypeChambre; label: string }[] = [
  { value: 'ENFANT', label: 'Enfants' },
  { value: 'EQUIPE', label: 'Équipe' },
];

const GENRES_CHAMBRE: { value: GenreChambre; label: string }[] = [
  { value: 'MASCULIN', label: 'Garçons' },
  { value: 'FEMININ', label: 'Filles' },
  { value: 'MIXTE', label: 'Mixte' },
];

type ChambreFormulaireModalProps = {
  visible: boolean;
  chambre: ChambreDto | null;
  groupes: GroupeDto[];
  enfants: EnfantDto[];
  equipe: MembreEquipePourChambre[];
  submitting: boolean;
  onFermer: () => void;
  onEnregistrer: (payload: SaveChambreRequest) => void;
};

type OptionSelect = { value: string; label: string };

function SelecteurPills<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.pillsRow}>
      {options.map((option) => {
        const actif = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => !disabled && onChange(option.value)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.pill,
              actif && styles.pillActif,
              pressed && !disabled && styles.pillPressed,
            ]}
          >
            <Text style={[styles.pillTexte, actif && styles.pillTexteActif]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SelecteurGroupe({
  options,
  value,
  onChange,
  disabled,
  erreur,
}: {
  options: OptionSelect[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  erreur?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const libelle = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? '';

  return (
    <View>
      <Pressable
        onPress={() => !disabled && setOuvert((prev) => !prev)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.selectGroupe,
          erreur && styles.inputErreur,
          pressed && !disabled && styles.selectGroupePressed,
        ]}
      >
        <Text style={styles.selectGroupeTexte} numberOfLines={2}>
          {libelle}
        </Text>
        <MaterialIcons name={ouvert ? 'expand-less' : 'expand-more'} size={22} color={colors.muted} />
      </Pressable>
      {ouvert ? (
        <View style={styles.groupeOptions}>
          {options.map((option) => {
            const actif = option.value === value;
            return (
              <Pressable
                key={option.value || '__aucun__'}
                onPress={() => {
                  onChange(option.value);
                  setOuvert(false);
                }}
                style={({ pressed }) => [
                  styles.groupeOption,
                  actif && styles.groupeOptionActif,
                  pressed && styles.groupeOptionPressed,
                ]}
              >
                {actif ? (
                  <MaterialIcons name="check" size={18} color={colors.primary} />
                ) : (
                  <View style={styles.groupeOptionSpacer} />
                )}
                <Text style={[styles.groupeOptionTexte, actif && styles.groupeOptionTexteActif]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {erreur ? <Text style={styles.erreurChamp}>{erreur}</Text> : null}
    </View>
  );
}

function buildPayload(
  formTypeChambre: TypeChambre,
  formIdentifiant: string,
  formNom: string,
  formCapaciteMax: string,
  formGenreAutorise: GenreChambre,
  formDescription: string,
  formBatiment: string,
  formCouloir: string,
  formEtage: string,
  formGroupeId: string,
): { payload: SaveChambreRequest | null; error: string | null } {
  const identifiant = formIdentifiant.trim();
  if (!identifiant) {
    return { payload: null, error: "L'identifiant de la chambre est obligatoire." };
  }
  if (identifiant.length > 50) {
    return { payload: null, error: "L'identifiant ne doit pas dépasser 50 caractères." };
  }

  const rawCap = formCapaciteMax.trim();
  const capaciteMax = Number.parseInt(rawCap, 10);
  if (!rawCap || Number.isNaN(capaciteMax) || capaciteMax < 1) {
    return { payload: null, error: 'La capacité maximale doit être un entier supérieur à 0.' };
  }

  const nomTrim = formNom.trim();
  if (nomTrim.length > 150) {
    return { payload: null, error: 'Le nom ne doit pas dépasser 150 caractères.' };
  }

  const descTrim = formDescription.trim();
  if (descTrim.length > 2000) {
    return { payload: null, error: 'Les remarques ne doivent pas dépasser 2000 caractères.' };
  }

  const batTrim = formBatiment.trim();
  if (batTrim.length > 100) {
    return { payload: null, error: 'Le bâtiment ne doit pas dépasser 100 caractères.' };
  }

  const couloirTrim = formCouloir.trim();
  if (couloirTrim.length > 100) {
    return { payload: null, error: 'Le couloir ne doit pas dépasser 100 caractères.' };
  }

  let etage: number | null = null;
  const rawEtage = formEtage.trim();
  if (rawEtage !== '') {
    const e = Number.parseInt(rawEtage, 10);
    if (Number.isNaN(e)) {
      return { payload: null, error: "L'étage doit être un entier (0 = RDC)." };
    }
    etage = e;
  }

  const payload: SaveChambreRequest = {
    typeChambre: formTypeChambre,
    identifiant,
    nom: nomTrim || null,
    capaciteMax,
    genreAutorise: formGenreAutorise,
    description: descTrim || null,
    batiment: batTrim || null,
    couloir: couloirTrim || null,
    etage,
  };

  if (formTypeChambre === 'ENFANT') {
    const rawGroupe = formGroupeId.trim();
    if (rawGroupe === '') {
      payload.groupeId = null;
    } else {
      const gid = Number.parseInt(rawGroupe, 10);
      if (Number.isNaN(gid)) {
        return { payload: null, error: 'Le groupe sélectionné est invalide.' };
      }
      payload.groupeId = gid;
    }
  }

  return { payload, error: null };
}

export default function ChambreFormulaireModal({
  visible,
  chambre,
  groupes,
  enfants,
  equipe,
  submitting,
  onFermer,
  onEnregistrer,
}: ChambreFormulaireModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = windowHeight * 0.92;

  const [formTypeChambre, setFormTypeChambre] = useState<TypeChambre>('ENFANT');
  const [formIdentifiant, setFormIdentifiant] = useState('');
  const [formNom, setFormNom] = useState('');
  const [formCapaciteMax, setFormCapaciteMax] = useState('');
  const [formGenreAutorise, setFormGenreAutorise] = useState<GenreChambre>('MIXTE');
  const [formDescription, setFormDescription] = useState('');
  const [formBatiment, setFormBatiment] = useState('');
  const [formCouloir, setFormCouloir] = useState('');
  const [formEtage, setFormEtage] = useState('');
  const [formGroupeId, setFormGroupeId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setErrorMessage(null);
    if (chambre) {
      setFormTypeChambre(chambre.typeChambre);
      setFormIdentifiant(chambre.identifiant);
      setFormNom(chambre.nom ?? '');
      setFormCapaciteMax(String(chambre.capaciteMax));
      setFormGenreAutorise(chambre.genreAutorise);
      setFormDescription(chambre.description ?? '');
      setFormBatiment(chambre.batiment ?? '');
      setFormCouloir(chambre.couloir ?? '');
      setFormEtage(chambre.etage != null ? String(chambre.etage) : '');
      setFormGroupeId(chambre.groupe?.id != null ? String(chambre.groupe.id) : '');
    } else {
      setFormTypeChambre('ENFANT');
      setFormIdentifiant('');
      setFormNom('');
      setFormCapaciteMax('');
      setFormGenreAutorise('MIXTE');
      setFormDescription('');
      setFormBatiment('');
      setFormCouloir('');
      setFormEtage('');
      setFormGroupeId('');
    }
  }, [visible, chambre]);

  const optionsGroupes = useMemo(
    (): OptionSelect[] => [
      { value: '', label: 'Aucun — tous les enfants du séjour' },
      ...groupes.map((groupe) => ({ value: String(groupe.id), label: groupe.nom })),
    ],
    [groupes],
  );

  const erreursModification = useMemo(() => {
    if (!chambre || !visible) return {};
    const rawCap = formCapaciteMax.trim();
    const capaciteMax = Number.parseInt(rawCap, 10);
    if (!rawCap || Number.isNaN(capaciteMax) || capaciteMax < 1) return {};

    let groupeId: number | null = null;
    if (formTypeChambre === 'ENFANT') {
      const rawGroupe = formGroupeId.trim();
      if (rawGroupe !== '') {
        const gid = Number.parseInt(rawGroupe, 10);
        if (!Number.isNaN(gid)) groupeId = gid;
      }
    }

    return analyserModificationChambreIncompatible(
      chambre,
      {
        typeChambre: formTypeChambre,
        capaciteMax,
        genreAutorise: formGenreAutorise,
        groupeId: formTypeChambre === 'ENFANT' ? groupeId : undefined,
      },
      groupes,
      enfants,
      equipe,
    );
  }, [
    chambre,
    visible,
    formCapaciteMax,
    formGenreAutorise,
    formGroupeId,
    formTypeChambre,
    groupes,
    enfants,
    equipe,
  ]);

  const enregistrementBloque = modificationChambreBloquee(erreursModification);

  const handleEnregistrer = () => {
    const { payload, error } = buildPayload(
      formTypeChambre,
      formIdentifiant,
      formNom,
      formCapaciteMax,
      formGenreAutorise,
      formDescription,
      formBatiment,
      formCouloir,
      formEtage,
      formGroupeId,
    );
    if (!payload) {
      setErrorMessage(error);
      return;
    }
    if (enregistrementBloque) return;
    setErrorMessage(null);
    onEnregistrer(payload);
  };

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
            showsVerticalScrollIndicator
            bounces
            nestedScrollEnabled={false}
          >
            <Text style={styles.titre}>
              {chambre == null ? 'Nouvelle chambre' : 'Modifier la chambre'}
            </Text>

            <Text style={styles.label}>Type de chambre</Text>
            <SelecteurPills
              options={TYPES_CHAMBRE}
              value={formTypeChambre}
              disabled={submitting}
              onChange={(value) => {
                setFormTypeChambre(value);
                if (value === 'EQUIPE') setFormGroupeId('');
              }}
            />

            <Text style={styles.label}>
              Identifiant <Text style={styles.obligatoire}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formIdentifiant}
              onChangeText={setFormIdentifiant}
              editable={!submitting}
              maxLength={50}
              placeholder='Ex. "12", "101"'
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Nom (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={formNom}
              onChangeText={setFormNom}
              editable={!submitting}
              maxLength={150}
              placeholder='Ex. "Les copains"'
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>
              Capacité maximale (lits) <Text style={styles.obligatoire}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, erreursModification.capaciteMax && styles.inputErreur]}
              value={formCapaciteMax}
              onChangeText={setFormCapaciteMax}
              editable={!submitting}
              keyboardType="number-pad"
            />
            {erreursModification.capaciteMax ? (
              <Text style={styles.erreurChamp}>{erreursModification.capaciteMax}</Text>
            ) : null}

            <Text style={styles.label}>Genre autorisé</Text>
            <SelecteurPills
              options={GENRES_CHAMBRE}
              value={formGenreAutorise}
              disabled={submitting}
              onChange={setFormGenreAutorise}
            />
            {erreursModification.genreAutorise ? (
              <Text style={styles.erreurChamp}>{erreursModification.genreAutorise}</Text>
            ) : null}

            {formTypeChambre === 'ENFANT' ? (
              <>
                <Text style={styles.label}>Groupe (optionnel)</Text>
                <SelecteurGroupe
                  options={optionsGroupes}
                  value={formGroupeId}
                  onChange={setFormGroupeId}
                  disabled={submitting || groupes.length === 0}
                  erreur={erreursModification.groupeId}
                />
              </>
            ) : null}

            <Text style={styles.label}>Bâtiment (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={formBatiment}
              onChangeText={setFormBatiment}
              editable={!submitting}
              maxLength={100}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Étage (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={formEtage}
              onChangeText={(texte) => setFormEtage(texte.replace(/\D/g, ''))}
              editable={!submitting}
              keyboardType="number-pad"
              placeholder="0 = RDC"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Couloir (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={formCouloir}
              onChangeText={setFormCouloir}
              editable={!submitting}
              maxLength={100}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Remarques (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={formDescription}
              onChangeText={setFormDescription}
              editable={!submitting}
              maxLength={2000}
              multiline
              placeholderTextColor={colors.placeholder}
            />

            {errorMessage ? <Text style={styles.erreurGlobale}>{errorMessage}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.boutonSecondaire, pressed && styles.boutonPressed]}
                onPress={onFermer}
                disabled={submitting}
              >
                <Text style={styles.boutonSecondaireTexte}>Annuler</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.boutonPrincipal,
                  (submitting || enregistrementBloque) && styles.boutonDesactive,
                  pressed && !submitting && !enregistrementBloque && styles.boutonPressed,
                ]}
                onPress={handleEnregistrer}
                disabled={submitting || enregistrementBloque}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.boutonPrincipalTexte}>
                    {chambre == null ? 'Créer' : 'Enregistrer'}
                  </Text>
                )}
              </Pressable>
            </View>
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
    width: '100%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContenu: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  titre: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  obligatoire: {
    color: colors.danger,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActif: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillPressed: {
    opacity: 0.85,
  },
  pillTexte: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontWeight: '600',
  },
  pillTexteActif: {
    color: colors.surface,
  },
  selectGroupe: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  selectGroupePressed: {
    backgroundColor: colors.background,
  },
  selectGroupeTexte: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  groupeOptions: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  groupeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupeOptionActif: {
    backgroundColor: colors.primarySoft,
  },
  groupeOptionPressed: {
    backgroundColor: colors.background,
  },
  groupeOptionSpacer: {
    width: 18,
  },
  groupeOptionTexte: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  groupeOptionTexteActif: {
    fontWeight: '700',
    color: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputErreur: {
    borderColor: colors.danger,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  erreurChamp: {
    marginTop: spacing.xs,
    fontSize: fontSizes.xs,
    color: colors.danger,
  },
  erreurGlobale: {
    marginTop: spacing.md,
    fontSize: fontSizes.sm,
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  boutonSecondaire: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boutonPrincipal: {
    minWidth: 110,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  boutonDesactive: {
    opacity: 0.5,
  },
  boutonPressed: {
    opacity: 0.85,
  },
  boutonSecondaireTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
  },
  boutonPrincipalTexte: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.surface,
  },
});
