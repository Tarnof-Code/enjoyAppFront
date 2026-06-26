import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSizes, spacing } from '../config/theme';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface PhotoProfilZoomModalProps {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
}

function reinitialiserTransform(
  scale: SharedValue<number>,
  savedScale: SharedValue<number>,
  translateX: SharedValue<number>,
  translateY: SharedValue<number>,
  savedTranslateX: SharedValue<number>,
  savedTranslateY: SharedValue<number>,
) {
  scale.value = withTiming(MIN_SCALE);
  savedScale.value = MIN_SCALE;
  translateX.value = withTiming(0);
  translateY.value = withTiming(0);
  savedTranslateX.value = 0;
  savedTranslateY.value = 0;
}

function PhotoProfilZoomModal({ visible, uri, onClose }: PhotoProfilZoomModalProps) {
  const { width, height } = useWindowDimensions();
  const imageSize = Math.min(width, height) * 0.92;

  const scale = useSharedValue(MIN_SCALE);
  const savedScale = useSharedValue(MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    scale.value = MIN_SCALE;
    savedScale.value = MIN_SCALE;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [visible, uri, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const next = savedScale.value * event.scale;
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE * 0.6, next));
    })
    .onEnd(() => {
      if (scale.value < MIN_SCALE) {
        reinitialiserTransform(
          scale,
          savedScale,
          translateX,
          translateY,
          savedTranslateX,
          savedTranslateY,
        );
        return;
      }
      if (scale.value > MAX_SCALE) {
        scale.value = MAX_SCALE;
      }
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= MIN_SCALE) return;
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > MIN_SCALE) {
        reinitialiserTransform(
          scale,
          savedScale,
          translateX,
          translateY,
          savedTranslateX,
          savedTranslateY,
        );
      } else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.overlay}>
          <Pressable style={styles.closeBtn} onPress={onClose} accessibilityLabel="Fermer">
            <Ionicons name="close" size={28} color={colors.surface} />
          </Pressable>

          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.imageWrap, animatedStyle]}>
              <Animated.Image
                source={{ uri }}
                style={{ width: imageSize, height: imageSize }}
                resizeMode="contain"
                accessibilityLabel="Photo de profil agrandie"
              />
            </Animated.View>
          </GestureDetector>

          <View style={styles.hintWrap} pointerEvents="none">
            <Text style={styles.hint}>Pincez pour zoomer · Double tap pour agrandir</Text>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.xxl + spacing.lg,
    right: spacing.lg,
    zIndex: 2,
    padding: spacing.sm,
  },
  imageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintWrap: {
    position: 'absolute',
    bottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  hint: {
    color: colors.surface,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    opacity: 0.85,
  },
});

export default PhotoProfilZoomModal;
