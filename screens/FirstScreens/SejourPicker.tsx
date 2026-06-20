import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { getUserFacingErrorMessage } from '../../helpers/axiosError';
import { enregistrerDernierSejourVisite } from '../../helpers/dernierSejour';
import { formatPeriodeSejour } from '../../helpers/sejourPeriode';
import type { RootStackParamList } from '../../Navigators/types';
import { sejourService } from '../../services/sejour.service';
import type { SejourDTO } from '../../types/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSejourCourant, setSejoursDisponibles } from '../../store/sejourSlice';

dayjs.locale('fr');

type SejourPickerProps = NativeStackScreenProps<RootStackParamList, 'SejourPicker'>;

function SejourPicker({ navigation }: SejourPickerProps) {
  const dispatch = useAppDispatch();
  const tokenId = useAppSelector((state) => state.auth.tokenId);
  const sejours = useAppSelector((state) => state.sejour.sejoursDisponibles);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<number | null>(null);

  const loadSejours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await sejourService.getAllSejoursByUtilisateur();
      dispatch(setSejoursDisponibles(list));
      if (list.length === 0) {
        setError('Aucun séjour disponible pour votre compte.');
      }
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Impossible de charger vos séjours.'));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void loadSejours();
  }, [loadSejours]);

  const handleSelect = async (sejour: SejourDTO) => {
    setSelectingId(sejour.id);
    try {
      const detail = await sejourService.getSejourById(sejour.id);
      dispatch(setSejourCourant(detail));
      if (tokenId) {
        await enregistrerDernierSejourVisite(tokenId, sejour.id);
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'BottomTab', params: { screen: 'Home' } }],
      });
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Impossible de sélectionner ce séjour.'));
    } finally {
      setSelectingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#121851" />
        <Text style={styles.loadingText}>Chargement de vos séjours…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes séjours</Text>
      <Text style={styles.subtitle}>Choisissez le séjour à consulter</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={sejours}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => void handleSelect(item)}
            disabled={selectingId !== null}
          >
            <Text style={styles.cardTitle}>{item.nom}</Text>
            <Text style={styles.cardMeta}>{formatPeriodeSejour(item)}</Text>
            {item.lieuDuSejour ? (
              <Text style={styles.cardLieu}>{item.lieuDuSejour}</Text>
            ) : null}
            {selectingId === item.id ? (
              <ActivityIndicator style={styles.cardSpinner} color="#121851" />
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          !error ? <Text style={styles.empty}>Aucun séjour à afficher.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f2f6',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f2f6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#121851',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#121851',
  },
  subtitle: {
    fontSize: 16,
    color: '#636e72',
    marginTop: 8,
    marginBottom: 20,
  },
  error: {
    color: '#F94A56',
    marginBottom: 12,
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#121851',
  },
  cardMeta: {
    marginTop: 6,
    fontSize: 14,
    color: '#636e72',
  },
  cardLieu: {
    marginTop: 4,
    fontSize: 13,
    color: '#b2bec3',
  },
  cardSpinner: {
    marginTop: 8,
  },
  empty: {
    textAlign: 'center',
    color: '#636e72',
    marginTop: 24,
  },
});

export default SejourPicker;
