import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { colors, fontSizes, radius, spacing } from '../config/theme';
import {
  LIBELLE_APPEL,
  LIBELLE_SOIN,
  ORDRE_APPELS,
  ORDRE_SOINS,
} from '../constants/cahierInfirmerieLabels';
import { parseDateDepuisValeurApi } from '../helpers/dateApi';
import {
  libelleEnfantDuSejour,
  libelleEquipeDuSejour,
  trierEnfantsDuSejour,
  trierEquipeDuSejour,
} from '../helpers/triListesSejour';
import type {
  CahierInfirmerieEntreeDto,
  SaveCahierInfirmerieEntreeRequest,
  SejourDTO,
  TypeAppelInfirmerie,
  TypeSoinInfirmerie,
} from '../types/api';

dayjs.locale('fr');

export type EnfantOptionCahier = { id: number; prenom: string; nom: string };
export type MembreSoigneurOption = { tokenId: string; nom: string; prenom: string };

type OptionDropdown = { value: string; label: string };

type CahierInfirmerieFormModalProps = {
  visible: boolean;
  sejour: SejourDTO;
  entree: CahierInfirmerieEntreeDto | null;
  enfants: EnfantOptionCahier[];
  soigneurs: MembreSoigneurOption[];
  tokenUtilisateur: string;
  submitting: boolean;
  error: string | null;
  onFermer: () => void;
  onEnregistrer: (body: SaveCahierInfirmerieEntreeRequest) => void;
};

function dateInitiale(entree: CahierInfirmerieEntreeDto | null): Date {
  if (entree) {
    const d = parseDateDepuisValeurApi(entree.dateHeure);
    if (d) return d;
  }
  return new Date();
}

function appliquerDate(base: Date, nouvelleDate: Date): Date {
  const d = new Date(base);
  d.setFullYear(nouvelleDate.getFullYear(), nouvelleDate.getMonth(), nouvelleDate.getDate());
  return d;
}

function appliquerHeure(base: Date, nouvelleHeure: Date): Date {
  const d = new Date(base);
  d.setHours(nouvelleHeure.getHours(), nouvelleHeure.getMinutes(), 0, 0);
  return d;
}

type PickerOuvert = 'date' | 'time';

function parserTemperatureCelsius(
  raw: string,
): { ok: true; value: number } | { ok: false; message: string } {
  const t = raw.trim().replace(',', '.');
  if (t === '') return { ok: false, message: 'Indiquez la température en °C.' };
  const n = Number(t);
  if (!Number.isFinite(n)) return { ok: false, message: 'Température invalide.' };
  if (n < 30 || n > 45) {
    return { ok: false, message: 'La température doit être comprise entre 30 et 45 °C.' };
  }
  return { ok: true, value: Math.round(n * 10) / 10 };
}

export default function CahierInfirmerieFormModal({
  visible,
  sejour,
  entree,
  enfants,
  soigneurs,
  tokenUtilisateur,
  submitting,
  error,
  onFermer,
  onEnregistrer,
}: CahierInfirmerieFormModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(windowHeight * 0.92);

  const estEdition = entree != null;

  const [dateHeure, setDateHeure] = useState(() => dateInitiale(null));
  const [enfantId, setEnfantId] = useState('');
  const [description, setDescription] = useState('');
  const [localisationCorps, setLocalisationCorps] = useState('');
  const [soins, setSoins] = useState<Set<TypeSoinInfirmerie>>(new Set());
  const [soinsAutrePrecision, setSoinsAutrePrecision] = useState('');
  const [temperatureStr, setTemperatureStr] = useState('');
  const [appels, setAppels] = useState<Set<TypeAppelInfirmerie>>(new Set());
  const [appelAutrePrecision, setAppelAutrePrecision] = useState('');
  const [soigneurTokenId, setSoigneurTokenId] = useState('');
  const [erreurLocale, setErreurLocale] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setErreurLocale(null);
    setDateHeure(dateInitiale(entree));
    setEnfantId(entree ? String(entree.enfantId) : '');
    setDescription(entree?.description ?? '');
    setLocalisationCorps(entree?.localisationCorps ?? '');
    setSoins(new Set(entree?.soins ?? []));
    setSoinsAutrePrecision(entree?.soinsAutrePrecision ?? '');
    setTemperatureStr(
      entree?.temperatureCelsius != null ? String(Math.round(entree.temperatureCelsius * 10) / 10) : '',
    );
    setAppels(new Set(entree?.appels ?? []));
    setAppelAutrePrecision(entree?.appelAutrePrecision ?? '');
    setSoigneurTokenId((entree?.soigneurTokenId ?? '').trim() || tokenUtilisateur);
  }, [visible, entree, tokenUtilisateur]);

  const optionsEnfants = useMemo<OptionDropdown[]>(() => {
    const tries = trierEnfantsDuSejour(enfants, sejour);
    return tries.map((e) => ({
      value: String(e.id),
      label: libelleEnfantDuSejour(e, sejour),
    }));
  }, [enfants, sejour]);

  const optionsSoigneurs = useMemo<OptionDropdown[]>(() => {
    const base = [...soigneurs];
    const tid = (entree?.soigneurTokenId ?? '').trim();
    if (tid && !base.some((m) => m.tokenId === tid)) {
      base.push({ tokenId: tid, nom: entree?.soigneurNom ?? '', prenom: entree?.soigneurPrenom ?? '' });
    }
    return trierEquipeDuSejour(base, sejour).map((m) => ({
      value: m.tokenId,
      label: libelleEquipeDuSejour(m, sejour) || '—',
    }));
  }, [soigneurs, sejour, entree]);

  const basculerSoin = (s: TypeSoinInfirmerie) => {
    setSoins((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const basculerAppel = (a: TypeAppelInfirmerie) => {
    setAppels((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  };

  const onPickerChangeIOS =
    (mode: PickerOuvert) => (event: DateTimePickerEvent, selected?: Date) => {
      if (event.type === 'dismissed' || !selected) return;
      setDateHeure((prev) =>
        mode === 'date' ? appliquerDate(prev, selected) : appliquerHeure(prev, selected),
      );
    };

  const ouvrirPickerAndroid = (mode: PickerOuvert) => {
    if (submitting) return;
    DateTimePickerAndroid.open({
      value: dateHeure,
      mode,
      is24Hour: true,
      onChange: (event, selected) => {
        if (event.type === 'dismissed' || !selected) return;
        setDateHeure((prev) =>
          mode === 'date' ? appliquerDate(prev, selected) : appliquerHeure(prev, selected),
        );
      },
    });
  };

  const handleEnregistrer = () => {
    setErreurLocale(null);
    if (Number.isNaN(dateHeure.getTime())) {
      setErreurLocale('La date et l’heure sont obligatoires.');
      return;
    }
    const eid = parseInt(enfantId, 10);
    if (!Number.isFinite(eid)) {
      setErreurLocale('Veuillez sélectionner un enfant.');
      return;
    }
    if (!description.trim()) {
      setErreurLocale('La description est obligatoire.');
      return;
    }
    if (soins.size === 0) {
      setErreurLocale('Sélectionnez au moins un type de soin.');
      return;
    }
    if (soins.has('AUTRE') && !soinsAutrePrecision.trim()) {
      setErreurLocale('Précisez le soin lorsque « Autre » est coché.');
      return;
    }
    if (appels.has('AUTRE') && !appelAutrePrecision.trim()) {
      setErreurLocale("Précisez l'appel lorsque « Autre » est coché.");
      return;
    }
    let temperaturePayload: number | undefined;
    if (soins.has('PRISE_TEMPERATURE')) {
      const parsed = parserTemperatureCelsius(temperatureStr);
      if (!parsed.ok) {
        setErreurLocale(parsed.message);
        return;
      }
      temperaturePayload = parsed.value;
    }
    const tid = soigneurTokenId.trim() || tokenUtilisateur.trim();
    if (!tid) {
      setErreurLocale('Le soigneur est obligatoire.');
      return;
    }

    onEnregistrer({
      dateHeure: dateHeure.toISOString(),
      enfantId: eid,
      description: description.trim(),
      localisationCorps: localisationCorps.trim() || null,
      soins: Array.from(soins),
      soinsAutrePrecision: soinsAutrePrecision.trim() || null,
      ...(temperaturePayload !== undefined ? { temperatureCelsius: temperaturePayload } : {}),
      appels: Array.from(appels),
      appelAutrePrecision: appelAutrePrecision.trim() || null,
      soigneurTokenId: tid,
    });
  };

  const messageErreur = erreurLocale ?? error;

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
            <Text style={styles.titre}>{estEdition ? "Modifier l'entrée" : 'Nouvelle entrée'}</Text>

            <View style={styles.ligneDouble}>
              <View style={styles.colonne}>
                <Text style={styles.label}>
                  Date <Text style={styles.obligatoire}>*</Text>
                </Text>
                {Platform.OS === 'ios' ? (
                  <View style={styles.pickerWrap}>
                    <DateTimePicker
                      value={dateHeure}
                      mode="date"
                      display="compact"
                      onChange={onPickerChangeIOS('date')}
                    />
                  </View>
                ) : (
                  <Pressable
                    onPress={() => ouvrirPickerAndroid('date')}
                    disabled={submitting}
                    style={({ pressed }) => [
                      styles.dateChamp,
                      submitting && styles.dateChampDesactive,
                      pressed && !submitting && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.dateChampTexte}>
                      {dayjs(dateHeure).format('DD/MM/YYYY')}
                    </Text>
                    <MaterialIcons name="event" size={20} color={colors.muted} />
                  </Pressable>
                )}
              </View>

              <View style={styles.colonne}>
                <Text style={styles.label}>
                  Heure <Text style={styles.obligatoire}>*</Text>
                </Text>
                {Platform.OS === 'ios' ? (
                  <View style={styles.pickerWrap}>
                    <DateTimePicker
                      value={dateHeure}
                      mode="time"
                      display="compact"
                      onChange={onPickerChangeIOS('time')}
                    />
                  </View>
                ) : (
                  <Pressable
                    onPress={() => ouvrirPickerAndroid('time')}
                    disabled={submitting}
                    style={({ pressed }) => [
                      styles.dateChamp,
                      submitting && styles.dateChampDesactive,
                      pressed && !submitting && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.dateChampTexte}>{dayjs(dateHeure).format('HH:mm')}</Text>
                    <MaterialIcons name="schedule" size={20} color={colors.muted} />
                  </Pressable>
                )}
              </View>
            </View>

            <Text style={styles.label}>
              Enfant <Text style={styles.obligatoire}>*</Text>
            </Text>
            {optionsEnfants.length === 0 ? (
              <Text style={styles.hint}>Aucun enfant inscrit à ce séjour.</Text>
            ) : (
              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownTexte}
                inputSearchStyle={styles.dropdownSearch}
                itemTextStyle={styles.dropdownItemText}
                activeColor={colors.primarySoft}
                disable={submitting}
                data={optionsEnfants}
                labelField="label"
                valueField="value"
                search
                searchPlaceholder="Rechercher un enfant…"
                placeholder="— Choisir un enfant —"
                value={enfantId || null}
                onChange={(item) => setEnfantId(item.value)}
              />
            )}

            <Text style={styles.label}>
              Description <Text style={styles.obligatoire}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              editable={!submitting}
              multiline
              numberOfLines={4}
              placeholder="Décrivez l'épisode ou le soin…"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Localisation sur le corps (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={localisationCorps}
              onChangeText={setLocalisationCorps}
              editable={!submitting}
              placeholder="ex. genou gauche"
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>
              Soins prodigués (au moins un) <Text style={styles.obligatoire}>*</Text>
            </Text>
            <View style={styles.cases}>
              {ORDRE_SOINS.map((s) => {
                const coche = soins.has(s);
                return (
                  <View key={s}>
                    <Pressable
                      onPress={() => !submitting && basculerSoin(s)}
                      style={styles.case}
                    >
                      <MaterialIcons
                        name={coche ? 'check-box' : 'check-box-outline-blank'}
                        size={22}
                        color={coche ? colors.primary : colors.muted}
                      />
                      <Text style={styles.caseTexte}>{LIBELLE_SOIN[s]}</Text>
                    </Pressable>
                    {s === 'PRISE_TEMPERATURE' && coche ? (
                      <View style={styles.tempLigne}>
                        <TextInput
                          style={[styles.input, styles.tempInput]}
                          value={temperatureStr}
                          onChangeText={setTemperatureStr}
                          editable={!submitting}
                          keyboardType="decimal-pad"
                          placeholder="ex. 37,5"
                          placeholderTextColor={colors.placeholder}
                          maxLength={5}
                        />
                        <Text style={styles.tempUnite}>°C</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {soins.has('AUTRE') ? (
              <>
                <Text style={styles.label}>
                  Précision « autre » soin <Text style={styles.obligatoire}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={soinsAutrePrecision}
                  onChangeText={setSoinsAutrePrecision}
                  editable={!submitting}
                  placeholderTextColor={colors.placeholder}
                />
              </>
            ) : null}

            <Text style={styles.label}>Appels éventuels</Text>
            <View style={styles.cases}>
              {ORDRE_APPELS.map((a) => {
                const coche = appels.has(a);
                return (
                  <Pressable
                    key={a}
                    onPress={() => !submitting && basculerAppel(a)}
                    style={styles.case}
                  >
                    <MaterialIcons
                      name={coche ? 'check-box' : 'check-box-outline-blank'}
                      size={22}
                      color={coche ? colors.primary : colors.muted}
                    />
                    <Text style={styles.caseTexte}>{LIBELLE_APPEL[a]}</Text>
                  </Pressable>
                );
              })}
            </View>

            {appels.has('AUTRE') ? (
              <>
                <Text style={styles.label}>
                  Précision « autre » appel <Text style={styles.obligatoire}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={appelAutrePrecision}
                  onChangeText={setAppelAutrePrecision}
                  editable={!submitting}
                  placeholderTextColor={colors.placeholder}
                />
              </>
            ) : null}

            <Text style={styles.label}>
              Soigné(e) par <Text style={styles.obligatoire}>*</Text>
            </Text>
            {optionsSoigneurs.length === 0 ? (
              <Text style={styles.hint}>Aucun soigneur disponible.</Text>
            ) : (
              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownTexte}
                itemTextStyle={styles.dropdownItemText}
                activeColor={colors.primarySoft}
                disable={submitting}
                data={optionsSoigneurs}
                labelField="label"
                valueField="value"
                placeholder="— Choisir —"
                value={soigneurTokenId || null}
                onChange={(item) => setSoigneurTokenId(item.value)}
              />
            )}

            {messageErreur ? <Text style={styles.erreur}>{messageErreur}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                onPress={onFermer}
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
                    {estEdition ? 'Enregistrer' : "Créer l'entrée"}
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
    gap: spacing.xs,
  },
  titre: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ligneDouble: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  colonne: {
    flex: 1,
  },
  pickerWrap: {
    marginTop: spacing.xs,
    alignItems: 'flex-start',
  },
  dateChamp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    minHeight: 44,
    backgroundColor: colors.surface,
  },
  dateChampDesactive: {
    opacity: 0.6,
  },
  dateChampTexte: {
    fontSize: fontSizes.md,
    color: colors.text,
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
    marginTop: spacing.xs,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  dropdown: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  dropdownContainer: {
    borderRadius: radius.sm,
    maxHeight: 320,
  },
  dropdownPlaceholder: {
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  dropdownTexte: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  dropdownSearch: {
    fontSize: fontSizes.sm,
    color: colors.text,
    borderRadius: radius.sm,
  },
  dropdownItemText: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  cases: {
    marginTop: spacing.xs,
    gap: 2,
  },
  case: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  caseTexte: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  tempLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 30,
    marginBottom: spacing.xs,
  },
  tempInput: {
    width: 110,
    marginTop: 0,
  },
  tempUnite: {
    fontSize: fontSizes.md,
    color: colors.text,
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
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
