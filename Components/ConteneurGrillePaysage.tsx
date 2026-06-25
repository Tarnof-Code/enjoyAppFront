import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

interface Props {
  modePaysage: boolean;
  children: React.ReactNode;
}

/** Affiche le contenu en paysage (rotation 90°) dans la zone disponible, sans tourner l'appareil. */
export default function ConteneurGrillePaysage({ modePaysage, children }: Props) {
  const [zone, setZone] = useState({ width: 0, height: 0 });

  const onLayoutZone = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setZone({ width, height });
  };

  if (!modePaysage) {
    return (
      <View style={styles.zone} onLayout={onLayoutZone}>
        {children}
      </View>
    );
  }

  const { width, height } = zone;
  if (width === 0 || height === 0) {
    return <View style={styles.zone} onLayout={onLayoutZone} />;
  }

  return (
    <View style={styles.zone} onLayout={onLayoutZone}>
      <View style={styles.centre}>
        <View
          style={{
            width: height,
            height: width,
            transform: [{ rotate: '90deg' }],
          }}
        >
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    flex: 1,
    overflow: 'hidden',
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
