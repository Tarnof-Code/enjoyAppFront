import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import Header from '../../Components/Header';
import { getUserFacingErrorMessage } from '../../helpers/axiosError';
import { jourISOdepuisValeurApi } from '../../helpers/dateApi';
import { planningGrilleService } from '../../services/planningGrille.service';
import { momentService } from '../../services/moment.service';
import { lieuService } from '../../services/lieu.service';
import { horaireService } from '../../services/horaire.service';
import { groupeService } from '../../services/groupe.service';
import type { OrganisationStackParamList } from '../../Navigators/types';
import type {
  PlanningCelluleDto,
  PlanningGrilleDetailDto,
  PlanningLigneDto,
} from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors } from '../../config/theme';

dayjs.locale('fr');

type Props = NativeStackScreenProps<OrganisationStackParamList, 'GrilleDetail'>;

function noms(ids: number[] | null | undefined, map: Map<number, string>): string[] {
  return (ids ?? []).map((id) => map.get(id)).filter((v): v is string => !!v);
}

function celluleDuJour(ligne: PlanningLigneDto, jour: string): PlanningCelluleDto | undefined {
  return ligne.cellules.find((c) => jourISOdepuisValeurApi(c.jour) === jour);
}

function GrilleDetailContent({ route }: Props) {
  const { grilleId } = route.params;
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejourId = sejour?.id;

  const [grille, setGrille] = useState<PlanningGrilleDetailDto | null>(null);
  const [moments, setMoments] = useState<Map<number, string>>(new Map());
  const [lieux, setLieux] = useState<Map<number, string>>(new Map());
  const [groupes, setGroupes] = useState<Map<number, string>>(new Map());
  const [horaires, setHoraires] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jourIndex, setJourIndex] = useState(0);

  const membres = new Map<string, string>();
  if (sejour?.directeur) {
    membres.set(sejour.directeur.tokenId, `${sejour.directeur.prenom} ${sejour.directeur.nom}`);
  }
  for (const m of sejour?.equipe ?? []) {
    membres.set(m.tokenId, `${m.prenom} ${m.nom}`);
  }

  const load = useCallback(async () => {
    if (sejourId == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [detail, momentsArr, lieuxArr, groupesArr, horairesArr] = await Promise.all([
        planningGrilleService.getPlanningGrilleById(sejourId, grilleId),
        momentService.getMomentsBySejour(sejourId).catch(() => []),
        lieuService.getLieuxBySejour(sejourId).catch(() => []),
        groupeService.getGroupesBySejour(sejourId).catch(() => []),
        horaireService.getHorairesBySejour(sejourId).catch(() => []),
      ]);
      setGrille(detail);
      setMoments(new Map(momentsArr.map((m) => [m.id, m.nom])));
      setLieux(new Map(lieuxArr.map((l) => [l.id, l.nom])));
      setGroupes(new Map(groupesArr.map((g) => [g.id, g.nom])));
      setHoraires(new Map(horairesArr.map((h) => [h.id, h.libelle])));
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Impossible de charger le planning.'));
    } finally {
      setLoading(false);
    }
  }, [sejourId, grilleId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!sejourId) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Aucun séjour sélectionné.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !grille) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Planning introuvable.'}</Text>
      </View>
    );
  }

  const jours = [
    ...new Set(
      grille.lignes
        .flatMap((ligne) => ligne.cellules.map((c) => jourISOdepuisValeurApi(c.jour)))
        .filter(Boolean),
    ),
  ].sort();

  if (jours.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Aucun contenu dans ce planning.</Text>
      </View>
    );
  }

  const indexCourant = Math.min(jourIndex, jours.length - 1);
  const jour = jours[indexCourant];

  const libelleLigne = (ligne: PlanningLigneDto): string => {
    switch (grille.sourceLibelleLignes) {
      case 'SAISIE_LIBRE':
        return ligne.libelleSaisieLibre ?? '';
      case 'HORAIRE':
        return (ligne.libelleHoraireId != null ? horaires.get(ligne.libelleHoraireId) : '') ?? '';
      case 'MOMENT':
        return (ligne.libelleMomentId != null ? moments.get(ligne.libelleMomentId) : '') ?? '';
      case 'GROUPE':
        return (ligne.libelleGroupeId != null ? groupes.get(ligne.libelleGroupeId) : '') ?? '';
      case 'LIEU':
        return (ligne.libelleLieuId != null ? lieux.get(ligne.libelleLieuId) : '') ?? '';
      case 'MEMBRE_EQUIPE':
        return (
          (ligne.libelleUtilisateurTokenId
            ? membres.get(ligne.libelleUtilisateurTokenId)
            : '') ?? ''
        );
      default:
        return ligne.libelleSaisieLibre ?? '';
    }
  };

  const lignesCellule = (cellule: PlanningCelluleDto): { label: string; valeur: string }[] => {
    const out: { label: string; valeur: string }[] = [];
    if (cellule.texteLibre?.trim()) out.push({ label: '', valeur: cellule.texteLibre.trim() });
    if (cellule.horaireLibelles?.length) {
      out.push({ label: 'Horaires', valeur: cellule.horaireLibelles.join(', ') });
    }
    const m = noms(cellule.momentIds, moments);
    if (m.length) out.push({ label: 'Moments', valeur: m.join(', ') });
    const g = noms(cellule.groupeIds, groupes);
    if (g.length) out.push({ label: 'Groupes', valeur: g.join(', ') });
    const l = noms(cellule.lieuIds, lieux);
    if (l.length) out.push({ label: 'Lieux', valeur: l.join(', ') });
    const a = (cellule.membreTokenIds ?? [])
      .map((t) => membres.get(t))
      .filter((v): v is string => !!v);
    if (a.length) out.push({ label: 'Animateurs', valeur: a.join(', ') });
    return out;
  };

  const lignesTriees = grille.lignes.slice().sort((a, b) => a.ordre - b.ordre);

  return (
    <View style={styles.container}>
      {grille.consigneGlobale ? (
        <Text style={styles.consigne}>{grille.consigneGlobale}</Text>
      ) : null}

      <View style={styles.dayNav}>
        <Pressable
          onPress={() => setJourIndex(indexCourant - 1)}
          disabled={indexCourant === 0}
          style={({ pressed }) => [
            styles.navBtn,
            (indexCourant === 0 || pressed) && styles.navBtnDisabled,
          ]}
        >
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.dayLabel}>{dayjs(jour).format('dddd D MMMM')}</Text>
        <Pressable
          onPress={() => setJourIndex(indexCourant + 1)}
          disabled={indexCourant >= jours.length - 1}
          style={({ pressed }) => [
            styles.navBtn,
            (indexCourant >= jours.length - 1 || pressed) && styles.navBtnDisabled,
          ]}
        >
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {lignesTriees.map((ligne) => {
          const cellule = celluleDuJour(ligne, jour);
          const contenu = cellule ? lignesCellule(cellule) : [];
          const label = libelleLigne(ligne);
          return (
            <View key={ligne.id} style={styles.card}>
              {label ? <Text style={styles.ligneLabel}>{label}</Text> : null}
              {contenu.length > 0 ? (
                contenu.map((c, index) => (
                  <Text key={index} style={styles.contenu}>
                    {c.label ? <Text style={styles.contenuLabel}>{c.label} : </Text> : null}
                    {c.valeur}
                  </Text>
                ))
              ) : (
                <Text style={styles.vide}>—</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function GrilleDetail(props: Props) {
  return (
    <SafeAreaProvider>
      <Header iconName="calendar-alt" title={props.route.params.titre} />
      <GrilleDetailContent {...props} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  consigne: {
    fontSize: 14,
    color: colors.muted,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navBtn: {
    width: 44,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  ligneLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  contenu: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  contenuLabel: {
    color: colors.muted,
  },
  vide: {
    fontSize: 14,
    color: colors.muted,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 24,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
