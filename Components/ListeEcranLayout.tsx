import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type FlatListProps,
  type LayoutChangeEvent,
} from 'react-native';

import EcranListeFond from './EcranListeFond';
import { colors } from '../config/theme';

export const ESPACE_FILTRES_LISTE = 12;

export const styleCarteListe = {
  shadowColor: '#383CA7',
  shadowOffset: { width: 0, height: 2 } as const,
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
};

type ListeAvecFiltresFixesProps<T> = Omit<
  FlatListProps<T>,
  'style' | 'contentContainerStyle' | 'refreshControl'
> & {
  filtres?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: FlatListProps<T>['contentContainerStyle'];
};

export function ListeAvecFiltresFixes<T>({
  filtres,
  refreshing = false,
  onRefresh,
  contentContainerStyle,
  ...flatListProps
}: ListeAvecFiltresFixesProps<T>) {
  const [hauteurFiltres, setHauteurFiltres] = useState(110);
  const hasFiltres = filtres != null;

  const onFiltresLayout = (event: LayoutChangeEvent) => {
    setHauteurFiltres(event.nativeEvent.layout.height);
  };

  return (
    <View style={styles.listeZone}>
      <FlatList
        {...flatListProps}
        style={styles.liste}
        contentContainerStyle={[
          styles.list,
          hasFiltres ? { paddingTop: hauteurFiltres } : undefined,
          contentContainerStyle,
        ]}
        refreshControl={
          onRefresh
            ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
                progressViewOffset={hasFiltres ? hauteurFiltres : 0}
              />
            )
            : undefined
        }
      />
      {hasFiltres ? (
        <View style={styles.filtresFixes} onLayout={onFiltresLayout}>
          {filtres}
          <View style={styles.espacementListe} />
        </View>
      ) : null}
    </View>
  );
}

type ListeEcranLayoutProps<T> = ListeAvecFiltresFixesProps<T>;

export function ListeEcranLayout<T>(props: ListeEcranLayoutProps<T>) {
  return (
    <EcranListeFond>
      <ListeAvecFiltresFixes {...props} />
    </EcranListeFond>
  );
}

const styles = StyleSheet.create({
  listeZone: {
    flex: 1,
  },
  liste: {
    flex: 1,
  },
  filtresFixes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: colors.background,
  },
  espacementListe: {
    height: ESPACE_FILTRES_LISTE,
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});

export default ListeEcranLayout;
