import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
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

import { LigneInfoFiche } from './FichePersonneModal';
import { colors, fontSizes, radius, spacing } from '../config/theme';
import { getUserFacingErrorMessage } from '../helpers/axiosError';
import { peutModifierDossierEnfant } from '../helpers/peutModifierDossierEnfant';
import { regexValidation } from '../helpers/regexValidation';
import { libelleEnfantDuSejour } from '../helpers/triListesSejour';
import { dossierEnfantService } from '../services/dossierEnfant.service';
import {
  referencesAlimentairesService,
  trierReferencesAlimentaires,
} from '../services/referencesAlimentaires.service';
import type {
  DossierEnfantDto,
  EnfantDossierSanitaireLigneDto,
  ReferenceAlimentaireDto,
  SejourDTO,
  UpdateDossierEnfantRequest,
} from '../types/api';

export type SectionDossierEnfant = 'contacts' | 'medical' | 'traitements' | 'autres';

type DossierEnfantModalProps = {
  visible: boolean;
  sejour: SejourDTO;
  ligne: EnfantDossierSanitaireLigneDto | null;
  tokenUtilisateur: string | null;
  onFermer: () => void;
  onDossierMisAJour: (enfantId: number, dossier: DossierEnfantDto) => void;
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

function titreSection(section: SectionDossierEnfant): string {
  switch (section) {
    case 'contacts':
      return 'Contacts parents';
    case 'medical':
      return 'Informations médicales';
    case 'traitements':
      return 'Traitements';
    case 'autres':
      return 'Autres informations';
  }
}

function toFormValue(v: string | null | undefined): string {
  return v ?? '';
}

function toRequestValue(v: string): string | null {
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}

function optionsCheckboxReferences(
  refsApi: ReferenceAlimentaireDto[],
  idsPourEntreesInactives: number[],
): { value: number; label: string }[] {
  const tri = trierReferencesAlimentaires(refsApi);
  const actifs = tri.filter((r) => r.actif);
  const inactifsSelectionnes = tri.filter(
    (r) => !r.actif && idsPourEntreesInactives.includes(r.id),
  );
  return [...actifs, ...inactifsSelectionnes].map((r) => ({
    value: r.id,
    label: r.actif ? r.libelle : `${r.libelle} (inactif)`,
  }));
}

function SectionEntete({
  titre,
  peutModifier,
  onModifier,
}: {
  titre: string;
  peutModifier: boolean;
  onModifier?: () => void;
}) {
  return (
    <View style={styles.sectionEntete}>
      <Text style={styles.sectionTitre}>{titre}</Text>
      {peutModifier && onModifier ? (
        <Pressable
          onPress={onModifier}
          style={({ pressed }) => [styles.btnModifier, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Modifier ${titre}`}
        >
          <MaterialIcons name="edit" size={18} color={colors.surface} />
        </Pressable>
      ) : null}
    </View>
  );
}

function DossierEnfantSectionFormModal({
  visible,
  section,
  sejourId,
  enfantId,
  dossier,
  onFermer,
  onEnregistre,
}: {
  visible: boolean;
  section: SectionDossierEnfant | null;
  sejourId: number;
  enfantId: number;
  dossier: DossierEnfantDto;
  onFermer: () => void;
  onEnregistre: (dossier: DossierEnfantDto) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(windowHeight * 0.92);

  const [emailParent1, setEmailParent1] = useState('');
  const [telephoneParent1, setTelephoneParent1] = useState('');
  const [emailParent2, setEmailParent2] = useState('');
  const [telephoneParent2, setTelephoneParent2] = useState('');
  const [informationsMedicales, setInformationsMedicales] = useState('');
  const [pai, setPai] = useState('');
  const [informationsAlimentaires, setInformationsAlimentaires] = useState('');
  const [traitementMatin, setTraitementMatin] = useState('');
  const [traitementMidi, setTraitementMidi] = useState('');
  const [traitementSoir, setTraitementSoir] = useState('');
  const [traitementSiBesoin, setTraitementSiBesoin] = useState('');
  const [autresInformations, setAutresInformations] = useState('');
  const [aPrendreEnSortie, setAPrendreEnSortie] = useState('');
  const [allergeneIds, setAllergeneIds] = useState<number[]>([]);
  const [regimePreferenceIds, setRegimePreferenceIds] = useState<number[]>([]);

  const [refsAllergenes, setRefsAllergenes] = useState<ReferenceAlimentaireDto[]>([]);
  const [refsRegimes, setRefsRegimes] = useState<ReferenceAlimentaireDto[]>([]);
  const [refsLoading, setRefsLoading] = useState(false);
  const [refsError, setRefsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !section) return;
    setEmailParent1(toFormValue(dossier.emailParent1));
    setTelephoneParent1(toFormValue(dossier.telephoneParent1));
    setEmailParent2(toFormValue(dossier.emailParent2));
    setTelephoneParent2(toFormValue(dossier.telephoneParent2));
    setInformationsMedicales(toFormValue(dossier.informationsMedicales));
    setPai(toFormValue(dossier.pai));
    setInformationsAlimentaires(toFormValue(dossier.informationsAlimentaires));
    setTraitementMatin(toFormValue(dossier.traitementMatin));
    setTraitementMidi(toFormValue(dossier.traitementMidi));
    setTraitementSoir(toFormValue(dossier.traitementSoir));
    setTraitementSiBesoin(toFormValue(dossier.traitementSiBesoin));
    setAutresInformations(toFormValue(dossier.autresInformations));
    setAPrendreEnSortie(toFormValue(dossier.aPrendreEnSortie));
    setAllergeneIds(dossier.allergenes?.map((r) => r.id) ?? []);
    setRegimePreferenceIds(dossier.regimesEtPreferences?.map((r) => r.id) ?? []);
    setErreur(null);
  }, [visible, section, dossier]);

  useEffect(() => {
    if (!visible || section !== 'medical') return;
    let cancelled = false;
    setRefsLoading(true);
    setRefsError(null);
    void (async () => {
      try {
        const [a, r] = await Promise.all([
          referencesAlimentairesService.getReferencesAlimentaires('ALLERGENE'),
          referencesAlimentairesService.getReferencesAlimentaires('REGIME_PREFERENCE'),
        ]);
        if (!cancelled) {
          setRefsAllergenes(a);
          setRefsRegimes(r);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setRefsError(
            getUserFacingErrorMessage(err, 'Impossible de charger les référentiels alimentaires'),
          );
        }
      } finally {
        if (!cancelled) setRefsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, section]);

  const allergOpts = useMemo(
    () => optionsCheckboxReferences(refsAllergenes, allergeneIds),
    [refsAllergenes, allergeneIds],
  );
  const regimeOpts = useMemo(
    () => optionsCheckboxReferences(refsRegimes, regimePreferenceIds),
    [refsRegimes, regimePreferenceIds],
  );

  const basculerId = (ids: number[], id: number, setter: (next: number[]) => void) => {
    if (ids.includes(id)) setter(ids.filter((x) => x !== id));
    else setter([...ids, id]);
  };

  const valider = (): string | null => {
    if (section === 'contacts') {
      if (emailParent1.trim() && !regexValidation.validateEmail(emailParent1.trim())) {
        return 'Email parent 1 invalide';
      }
      if (emailParent2.trim() && !regexValidation.validateEmail(emailParent2.trim())) {
        return 'Email parent 2 invalide';
      }
      const tel1 = telephoneParent1.replace(/\s/g, '');
      if (tel1 && !regexValidation.validatePhone(tel1)) {
        return 'Téléphone parent 1 invalide (10 chiffres commençant par 0)';
      }
      const tel2 = telephoneParent2.replace(/\s/g, '');
      if (tel2 && !regexValidation.validatePhone(tel2)) {
        return 'Téléphone parent 2 invalide (10 chiffres commençant par 0)';
      }
    }
    return null;
  };

  const enregistrer = async () => {
    if (!section || submitting) return;
    const validation = valider();
    if (validation) {
      setErreur(validation);
      return;
    }
    setSubmitting(true);
    setErreur(null);
    try {
      const request: UpdateDossierEnfantRequest = {
        emailParent1: toRequestValue(emailParent1),
        telephoneParent1: toRequestValue(telephoneParent1),
        emailParent2: toRequestValue(emailParent2),
        telephoneParent2: toRequestValue(telephoneParent2),
        informationsMedicales: toRequestValue(informationsMedicales),
        pai: toRequestValue(pai),
        informationsAlimentaires: toRequestValue(informationsAlimentaires),
        traitementMatin: toRequestValue(traitementMatin),
        traitementMidi: toRequestValue(traitementMidi),
        traitementSoir: toRequestValue(traitementSoir),
        traitementSiBesoin: toRequestValue(traitementSiBesoin),
        autresInformations: toRequestValue(autresInformations),
        aPrendreEnSortie: toRequestValue(aPrendreEnSortie),
        allergeneIds,
        regimePreferenceIds,
      };
      const misAJour = await dossierEnfantService.updateDossierEnfant(sejourId, enfantId, request);
      onEnregistre(misAJour);
      onFermer();
    } catch (err: unknown) {
      setErreur(getUserFacingErrorMessage(err, 'Impossible de modifier le dossier'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!section) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      <View style={styles.root}>
        <Pressable style={styles.zoneFermer} onPress={!submitting ? onFermer : undefined} />
        <View style={[styles.sheet, { maxHeight: sheetMaxHeight, paddingBottom: insets.bottom }]}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContenu}>
            <Text style={styles.titre}>{titreSection(section)}</Text>

            {section === 'contacts' ? (
              <>
                <Text style={styles.label}>Email parent 1</Text>
                <TextInput
                  style={styles.input}
                  value={emailParent1}
                  onChangeText={setEmailParent1}
                  editable={!submitting}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.label}>Téléphone parent 1</Text>
                <TextInput
                  style={styles.input}
                  value={telephoneParent1}
                  onChangeText={setTelephoneParent1}
                  editable={!submitting}
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.label}>Email parent 2</Text>
                <TextInput
                  style={styles.input}
                  value={emailParent2}
                  onChangeText={setEmailParent2}
                  editable={!submitting}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.label}>Téléphone parent 2</Text>
                <TextInput
                  style={styles.input}
                  value={telephoneParent2}
                  onChangeText={setTelephoneParent2}
                  editable={!submitting}
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.placeholder}
                />
              </>
            ) : null}

            {section === 'medical' ? (
              <>
                <Text style={styles.label}>Informations médicales générales</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={informationsMedicales}
                  onChangeText={setInformationsMedicales}
                  editable={!submitting}
                  multiline
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.label}>PAI (Projet d&apos;Accueil Individualisé)</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={pai}
                  onChangeText={setPai}
                  editable={!submitting}
                  multiline
                  placeholderTextColor={colors.placeholder}
                />
                {refsLoading ? (
                  <ActivityIndicator color={colors.primary} style={styles.chargementRefs} />
                ) : refsError ? (
                  <Text style={styles.erreur}>{refsError}</Text>
                ) : (
                  <>
                    <Text style={styles.label}>Allergènes</Text>
                    <View style={styles.cases}>
                      {allergOpts.map((opt) => {
                        const coche = allergeneIds.includes(opt.value);
                        return (
                          <Pressable
                            key={opt.value}
                            onPress={() =>
                              !submitting && basculerId(allergeneIds, opt.value, setAllergeneIds)
                            }
                            style={styles.case}
                          >
                            <MaterialIcons
                              name={coche ? 'check-box' : 'check-box-outline-blank'}
                              size={22}
                              color={coche ? colors.primary : colors.muted}
                            />
                            <Text style={styles.caseTexte}>{opt.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={styles.label}>Régimes et préférences alimentaires</Text>
                    <View style={styles.cases}>
                      {regimeOpts.map((opt) => {
                        const coche = regimePreferenceIds.includes(opt.value);
                        return (
                          <Pressable
                            key={opt.value}
                            onPress={() =>
                              !submitting &&
                              basculerId(regimePreferenceIds, opt.value, setRegimePreferenceIds)
                            }
                            style={styles.case}
                          >
                            <MaterialIcons
                              name={coche ? 'check-box' : 'check-box-outline-blank'}
                              size={22}
                              color={coche ? colors.primary : colors.muted}
                            />
                            <Text style={styles.caseTexte}>{opt.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}
                <Text style={styles.label}>Informations alimentaires (complément)</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={informationsAlimentaires}
                  onChangeText={setInformationsAlimentaires}
                  editable={!submitting}
                  multiline
                  placeholderTextColor={colors.placeholder}
                />
              </>
            ) : null}

            {section === 'traitements' ? (
              <>
                <Text style={styles.label}>Traitement matin</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={traitementMatin}
                  onChangeText={setTraitementMatin}
                  editable={!submitting}
                  multiline
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.label}>Traitement midi</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={traitementMidi}
                  onChangeText={setTraitementMidi}
                  editable={!submitting}
                  multiline
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.label}>Traitement soir</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={traitementSoir}
                  onChangeText={setTraitementSoir}
                  editable={!submitting}
                  multiline
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.label}>Traitement si besoin</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={traitementSiBesoin}
                  onChangeText={setTraitementSiBesoin}
                  editable={!submitting}
                  multiline
                  placeholderTextColor={colors.placeholder}
                />
              </>
            ) : null}

            {section === 'autres' ? (
              <>
                <Text style={styles.label}>Autres informations</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={autresInformations}
                  onChangeText={setAutresInformations}
                  editable={!submitting}
                  multiline
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.label}>À prendre en sortie</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={aPrendreEnSortie}
                  onChangeText={setAPrendreEnSortie}
                  editable={!submitting}
                  multiline
                  placeholderTextColor={colors.placeholder}
                />
              </>
            ) : null}

            {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

            <View style={styles.actions}>
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
                  (pressed || submitting) && styles.btnPressed,
                  submitting && styles.btnDisabled,
                ]}
                onPress={() => void enregistrer()}
                disabled={submitting || (section === 'medical' && refsLoading)}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.btnPrimaireTexte}>Enregistrer</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function DossierEnfantModal({
  visible,
  sejour,
  ligne,
  tokenUtilisateur,
  onFermer,
  onDossierMisAJour,
}: DossierEnfantModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(windowHeight * 0.92);

  const [dossier, setDossier] = useState<DossierEnfantDto | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [sectionEdition, setSectionEdition] = useState<SectionDossierEnfant | null>(null);

  const peutModifier = useMemo(
    () => peutModifierDossierEnfant(tokenUtilisateur, sejour.directeur, sejour.equipe),
    [tokenUtilisateur, sejour],
  );

  useEffect(() => {
    if (!visible || !ligne) {
      setDossier(null);
      setErreur(null);
      setSectionEdition(null);
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

  const fermer = () => {
    if (sectionEdition) return;
    onFermer();
  };

  const groupesLabel = ligne?.groupes.map((g) => g.libelle).filter(Boolean).join(', ') ?? '';
  const enfantNom = ligne ? libelleEnfantDuSejour(ligne, sejour) : '';

  const handleDossierMisAJour = (misAJour: DossierEnfantDto) => {
    setDossier(misAJour);
    if (ligne) onDossierMisAJour(ligne.enfantId, misAJour);
  };

  return (
    <>
      <Modal visible={visible && sectionEdition == null} transparent animationType="slide" onRequestClose={fermer}>
        <View style={styles.root}>
          <Pressable style={styles.zoneFermer} onPress={fermer} />
          <View style={[styles.sheet, { maxHeight: sheetMaxHeight, paddingBottom: insets.bottom }]}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContenu}>
              <Text style={styles.titre}>Dossier sanitaire</Text>
              {enfantNom ? <Text style={styles.sousTitre}>{enfantNom}</Text> : null}
              {groupesLabel ? <Text style={styles.groupes}>{groupesLabel}</Text> : null}

              {chargement ? (
                <ActivityIndicator color={colors.primary} style={styles.chargementRefs} />
              ) : erreur ? (
                <Text style={styles.erreur}>{erreur}</Text>
              ) : dossier ? (
                <>
                  <View style={styles.section}>
                    <SectionEntete
                      titre="Contacts parents"
                      peutModifier={peutModifier}
                      onModifier={() => setSectionEdition('contacts')}
                    />
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
                    <SectionEntete
                      titre="Informations médicales"
                      peutModifier={peutModifier}
                      onModifier={() => setSectionEdition('medical')}
                    />
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
                    <SectionEntete
                      titre="Traitements"
                      peutModifier={peutModifier}
                      onModifier={() => setSectionEdition('traitements')}
                    />
                    <LigneInfoFiche libelle="Matin" valeur={formatValue(dossier.traitementMatin)} />
                    <LigneInfoFiche libelle="Midi" valeur={formatValue(dossier.traitementMidi)} />
                    <LigneInfoFiche libelle="Soir" valeur={formatValue(dossier.traitementSoir)} />
                    <LigneInfoFiche libelle="Si besoin" valeur={formatValue(dossier.traitementSiBesoin)} />
                  </View>

                  <View style={styles.section}>
                    <SectionEntete
                      titre="Autres informations"
                      peutModifier={peutModifier}
                      onModifier={() => setSectionEdition('autres')}
                    />
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
                onPress={fermer}
              >
                <Text style={styles.btnFermerTexte}>Fermer</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {dossier && ligne ? (
        <DossierEnfantSectionFormModal
          visible={sectionEdition != null}
          section={sectionEdition}
          sejourId={sejour.id}
          enfantId={ligne.enfantId}
          dossier={dossier}
          onFermer={() => setSectionEdition(null)}
          onEnregistre={handleDossierMisAJour}
        />
      ) : null}
    </>
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
  sectionEntete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitre: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.info,
  },
  btnModifier: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    padding: spacing.xs,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
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
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cases: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  case: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  caseTexte: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  chargementRefs: {
    marginVertical: spacing.lg,
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
  btnDisabled: {
    opacity: 0.6,
  },
});
