import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import Header from '../../Components/Header';
import { useChargementRafraichissable } from '../../hooks/useChargementRafraichissable';
import {
  ORDRE_REPAS,
  jourISOdepuisDateRepas,
  typeRepasNormalise,
} from '../../helpers/menuRepas';
import { menuService } from '../../services/menu.service';
import type { MenuRepasDto, TypeRepas } from '../../types/api';
import { useAppSelector } from '../../store/hooks';
import { colors } from '../../config/theme';

dayjs.locale('fr');

const LIBELLE_REPAS: Record<TypeRepas, string> = {
  PETIT_DEJEUNER: 'Petit-déjeuner',
  DEJEUNER: 'Déjeuner',
  GOUTER: 'Goûter',
  DINER: 'Dîner',
};

interface JourSection {
  title: string;
  data: MenuRepasDto[];
}

function lignesRepas(menu: MenuRepasDto): string[] {
  if (menu.typeRepas === 'PETIT_DEJEUNER' || menu.typeRepas === 'GOUTER') {
    return [menu.detailPetitDejeunerOuGouter].filter((v): v is string => !!v);
  }
  return [menu.entree, menu.plat, menu.fromageOuEntremet, menu.dessert].filter(
    (v): v is string => !!v,
  );
}

function construireSections(menus: MenuRepasDto[]): JourSection[] {
  const parJour = new Map<string, MenuRepasDto[]>();
  for (const menu of menus) {
    const jour = jourISOdepuisDateRepas(menu.dateRepas as unknown);
    const type = typeRepasNormalise(menu.typeRepas as unknown);
    if (!jour || !type) continue;
    const liste = parJour.get(jour) ?? [];
    liste.push({ ...menu, dateRepas: jour, typeRepas: type });
    parJour.set(jour, liste);
  }
  return [...parJour.keys()].sort().map((jour) => ({
    title: dayjs(jour).format('dddd D MMMM'),
    data: parJour
      .get(jour)!
      .slice()
      .sort((a, b) => ORDRE_REPAS.indexOf(a.typeRepas) - ORDRE_REPAS.indexOf(b.typeRepas)),
  }));
}

function MenusList() {
  const sejour = useAppSelector((state) => state.sejour.sejourCourant);
  const sejourId = sejour?.id;
  const [menus, setMenus] = useState<MenuRepasDto[]>([]);

  const executer = useCallback(async () => {
    if (sejourId == null || sejour == null) return;
    const dateDebut = dayjs(sejour.dateDebut).format('YYYY-MM-DD');
    const dateFin = dayjs(sejour.dateFin).format('YYYY-MM-DD');
    setMenus(await menuService.getMenusBySejour(sejourId, dateDebut, dateFin));
  }, [sejourId, sejour]);

  const { loading, refreshing, error, refresh } = useChargementRafraichissable(
    executer,
    'Impossible de charger les menus.',
  );

  const sections = construireSections(menus);

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

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.jour}>{section.title}</Text>
      )}
      renderItem={({ item }) => {
        const lignes = lignesRepas(item);
        const allergenes = item.allergenes ?? [];
        const regimes = item.regimesEtPreferences ?? [];
        return (
          <View style={styles.card}>
            <Text style={styles.repas}>{LIBELLE_REPAS[item.typeRepas]}</Text>
            {lignes.length > 0 ? (
              lignes.map((ligne, index) => (
                <Text key={index} style={styles.plat}>
                  {ligne}
                </Text>
              ))
            ) : (
              <Text style={styles.platVide}>Non renseigné</Text>
            )}
            {allergenes.length > 0 ? (
              <Text style={styles.refs}>
                Allergènes : {allergenes.map((a) => a.libelle).join(', ')}
              </Text>
            ) : null}
            {regimes.length > 0 ? (
              <Text style={styles.refs}>
                Régimes : {regimes.map((r) => r.libelle).join(', ')}
              </Text>
            ) : null}
          </View>
        );
      }}
      ListEmptyComponent={
        <Text style={styles.empty}>Aucun menu pour ce séjour.</Text>
      }
    />
  );
}

export default function Menus() {
  return (
    <SafeAreaProvider>
      <Header iconName="utensils" title="Menus" />
      <MenusList />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  list: {
    padding: 12,
    backgroundColor: colors.surface,
  },
  jour: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  repas: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  plat: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  platVide: {
    fontSize: 14,
    color: colors.muted,
    fontStyle: 'italic',
  },
  refs: {
    marginTop: 6,
    fontSize: 13,
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
