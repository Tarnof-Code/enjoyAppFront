import React from 'react';
import { Text, View } from 'react-native';
import { Overlay } from '@rneui/themed';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { hide } from '../store/overlaySlice';

function BirthdayOverlay() {
  const dispatch = useAppDispatch();
  const { visible, date } = useAppSelector((state) => state.overlay);

  return (
    <Overlay
      overlayStyle={{ flex: 0.2, width: 250, borderRadius: 50 }}
      isVisible={visible}
      onBackdropPress={() => {
        dispatch(hide());
      }}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Text style={{ fontSize: 30, textAlign: 'center' }}>Anniversaire le {date}</Text>
      </View>
    </Overlay>
  );
}

export default BirthdayOverlay;
