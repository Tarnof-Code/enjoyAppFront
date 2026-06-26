import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import {
  exporterPhotoProfilRecadreeMobile,
  type PhotoRecadreeMobile,
} from '../helpers/photoProfilRecadrage';
import { colors, fontSizes, radius, spacing } from '../config/theme';

interface PhotoProfilRecadrageModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onSave: (photo: PhotoRecadreeMobile) => Promise<void>;
  saving?: boolean;
}

const VIEWPORT_RATIO = 0.78;

function contraindreTranslationWorklet(
  imageWidth: number,
  imageHeight: number,
  cropSize: number,
  userScale: number,
  translateX: number,
  translateY: number,
) {
  'worklet';
  const scale = Math.max(1, userScale);
  const baseScale = Math.max(cropSize / imageWidth, cropSize / imageHeight);
  const displayedW = imageWidth * baseScale * scale;
  const displayedH = imageHeight * baseScale * scale;
  const minTx = (cropSize - displayedW) / 2;
  const maxTx = (displayedW - cropSize) / 2;
  const minTy = (cropSize - displayedH) / 2;
  const maxTy = (displayedH - cropSize) / 2;

  return {
    scale,
    translateX: Math.min(maxTx, Math.max(minTx, translateX)),
    translateY: Math.min(maxTy, Math.max(minTy, translateY)),
  };
}

function PhotoProfilRecadrageModal({
  visible,
  imageUri,
  onClose,
  onSave,
  saving = false,
}: PhotoProfilRecadrageModalProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cropSize = Math.round(screenWidth * VIEWPORT_RATIO);

  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageWidth = useSharedValue(0);
  const imageHeight = useSharedValue(0);
  const cropSizeSv = useSharedValue(cropSize);
  const userScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    cropSizeSv.value = cropSize;
  }, [cropSize, cropSizeSv]);

  useEffect(() => {
    if (!visible || !imageUri) {
      setImageSize(null);
      setErrorMessage(null);
      imageWidth.value = 0;
      imageHeight.value = 0;
      userScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedScale.value = 1;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      return;
    }

    Image.getSize(
      imageUri,
      (width, height) => {
        setImageSize({ width, height });
        imageWidth.value = width;
        imageHeight.value = height;
        userScale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      },
      () => setErrorMessage("Impossible de charger l'image"),
    );
  }, [
    visible,
    imageUri,
    imageWidth,
    imageHeight,
    userScale,
    translateX,
    translateY,
    savedScale,
    savedTranslateX,
    savedTranslateY,
  ]);

  const pinch = Gesture.Pinch()
    .enabled(!saving)
    .onBegin(() => {
      savedScale.value = userScale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const imgW = imageWidth.value;
      const imgH = imageHeight.value;
      const crop = cropSizeSv.value;
      if (!imgW || !imgH) return;

      const nextScale = Math.max(1, savedScale.value * event.scale);
      const constrained = contraindreTranslationWorklet(
        imgW,
        imgH,
        crop,
        nextScale,
        translateX.value,
        translateY.value,
      );
      userScale.value = constrained.scale;
      translateX.value = constrained.translateX;
      translateY.value = constrained.translateY;
    })
    .onEnd(() => {
      savedScale.value = userScale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pan = Gesture.Pan()
    .enabled(!saving)
    .onBegin(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const imgW = imageWidth.value;
      const imgH = imageHeight.value;
      const crop = cropSizeSv.value;
      if (!imgW || !imgH) return;

      const constrained = contraindreTranslationWorklet(
        imgW,
        imgH,
        crop,
        userScale.value,
        savedTranslateX.value + event.translationX,
        savedTranslateY.value + event.translationY,
      );
      translateX.value = constrained.translateX;
      translateY.value = constrained.translateY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const gesture = Gesture.Simultaneous(pinch, pan);

  const animatedImageStyle = useAnimatedStyle(() => {
    const imgW = imageWidth.value;
    const imgH = imageHeight.value;
    const crop = cropSizeSv.value;
    if (!imgW || !imgH) {
      return { opacity: 0 };
    }

    const baseScale = Math.max(crop / imgW, crop / imgH);
    const totalScale = baseScale * userScale.value;
    const width = imgW * totalScale;
    const height = imgH * totalScale;
    const left = (crop - width) / 2 + translateX.value;
    const top = (crop - height) / 2 + translateY.value;

    return {
      position: 'absolute',
      width,
      height,
      left,
      top,
      opacity: 1,
    };
  });

  const handleSave = async () => {
    if (!imageUri || !imageSize) return;
    setErrorMessage(null);
    try {
      const photo = await exporterPhotoProfilRecadreeMobile(imageUri, cropSize, {
        scale: userScale.value,
        translateX: translateX.value,
        translateY: translateY.value,
      });
      await onSave(photo);
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message.trim() !== ''
          ? err.message
          : "Impossible d'enregistrer le recadrage";
      setErrorMessage(message);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => !saving && onClose()}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.screen}>
          <Text style={styles.title}>Recadrer la photo</Text>

          <View
            style={[
              styles.cropZone,
              { width: cropSize, height: cropSize, borderRadius: cropSize / 2 },
            ]}
          >
            {!imageUri || !imageSize ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <GestureDetector gesture={gesture}>
                <View style={styles.cropInner}>
                  <Animated.Image
                    source={{ uri: imageUri }}
                    style={animatedImageStyle}
                    resizeMode="cover"
                  />
                </View>
              </GestureDetector>
            )}
            <View
              style={[styles.cropMask, { borderRadius: cropSize / 2 }]}
              pointerEvents="none"
            />
          </View>

          <Text style={styles.hint}>Pincez et déplacez pour cadrer dans le cercle</Text>

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={styles.btnSecondary}
              onPress={onClose}
              disabled={saving}
              accessibilityRole="button"
            >
              <Text style={styles.btnSecondaryText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, (saving || !imageSize) && styles.btnDisabled]}
              onPress={() => void handleSave()}
              disabled={saving || !imageSize}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.btnPrimaryText}>Valider</Text>
              )}
            </Pressable>
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
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingTop: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  title: {
    color: colors.surface,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  cropZone: {
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  cropInner: {
    flex: 1,
  },
  cropMask: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  hint: {
    color: colors.surface,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.lg,
    opacity: 0.85,
  },
  error: {
    color: colors.dangerSoft,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 'auto',
    marginBottom: spacing.xxl,
    paddingTop: spacing.xl,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    minWidth: 130,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  btnSecondary: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface,
    minWidth: 130,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: colors.surface,
    fontSize: fontSizes.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default PhotoProfilRecadrageModal;
