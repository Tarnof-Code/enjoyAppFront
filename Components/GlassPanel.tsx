import React from 'react';
import { BlurView } from 'expo-blur';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius } from '../config/theme';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
  overlayOpacity?: number;
}

function GlassPanel({
  children,
  style,
  contentStyle,
  intensity = 55,
  borderRadius = radius.md,
  overlayOpacity = 0.14,
}: GlassPanelProps) {
  const blurEnabled = Platform.OS === 'ios';
  const frostedOpacity = blurEnabled ? overlayOpacity : overlayOpacity + 0.22;

  return (
    <View style={[styles.wrap, { borderRadius }, style]}>
      {blurEnabled ? (
        <BlurView
          intensity={intensity}
          tint="light"
          style={[StyleSheet.absoluteFillObject, { borderRadius }]}
        />
      ) : null}
      <View
        style={[
          styles.overlay,
          { borderRadius, backgroundColor: `rgba(255, 255, 255, ${frostedOpacity})` },
        ]}
        pointerEvents="none"
      />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'relative',
  },
});

export default GlassPanel;
