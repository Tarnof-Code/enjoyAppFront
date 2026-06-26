import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

export interface TransformRecadrage {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface PhotoRecadreeMobile {
  uri: string;
  mimeType: string;
  fileName: string;
}

function echelleDeBase(imageWidth: number, imageHeight: number, cropSize: number): number {
  return Math.max(cropSize / imageWidth, cropSize / imageHeight);
}

/** Limite le déplacement pour que la zone de recadrage reste couverte. */
export function contraindreTransformRecadrage(
  imageWidth: number,
  imageHeight: number,
  cropSize: number,
  transform: TransformRecadrage,
): TransformRecadrage {
  const scale = Math.max(1, transform.scale);
  const baseScale = echelleDeBase(imageWidth, imageHeight, cropSize);
  const displayedW = imageWidth * baseScale * scale;
  const displayedH = imageHeight * baseScale * scale;

  const minTx = (cropSize - displayedW) / 2;
  const maxTx = (displayedW - cropSize) / 2;
  const minTy = (cropSize - displayedH) / 2;
  const maxTy = (displayedH - cropSize) / 2;

  return {
    scale,
    translateX: Math.min(maxTx, Math.max(minTx, transform.translateX)),
    translateY: Math.min(maxTy, Math.max(minTy, transform.translateY)),
  };
}

export function calculerCropDepuisTransform(
  imageWidth: number,
  imageHeight: number,
  cropSize: number,
  transform: TransformRecadrage,
): { originX: number; originY: number; width: number; height: number } {
  const { scale, translateX, translateY } = contraindreTransformRecadrage(
    imageWidth,
    imageHeight,
    cropSize,
    transform,
  );
  const baseScale = echelleDeBase(imageWidth, imageHeight, cropSize);
  const totalScale = baseScale * scale;
  const displayedW = imageWidth * totalScale;
  const displayedH = imageHeight * totalScale;
  const left = (cropSize - displayedW) / 2 + translateX;
  const top = (cropSize - displayedH) / 2 + translateY;

  let originX = -left / totalScale;
  let originY = -top / totalScale;
  let size = cropSize / totalScale;

  originX = Math.max(0, Math.min(originX, imageWidth - 1));
  originY = Math.max(0, Math.min(originY, imageHeight - 1));
  size = Math.min(size, imageWidth - originX, imageHeight - originY);

  return {
    originX: Math.round(originX),
    originY: Math.round(originY),
    width: Math.round(size),
    height: Math.round(size),
  };
}

function lireDimensionsImage(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => reject(new Error("Impossible de charger l'image")),
    );
  });
}

export async function exporterPhotoProfilRecadreeMobile(
  imageUri: string,
  cropSize: number,
  transform: TransformRecadrage,
): Promise<PhotoRecadreeMobile> {
  const { width, height } = await lireDimensionsImage(imageUri);
  const crop = calculerCropDepuisTransform(width, height, cropSize, transform);

  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ crop }],
    { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
  );

  return {
    uri: result.uri,
    mimeType: 'image/jpeg',
    fileName: 'photo-profil.jpg',
  };
}

export function dimensionsAffichageRecadrage(
  imageWidth: number,
  imageHeight: number,
  cropSize: number,
  transform: TransformRecadrage,
): { width: number; height: number; left: number; top: number } {
  const { scale, translateX, translateY } = contraindreTransformRecadrage(
    imageWidth,
    imageHeight,
    cropSize,
    transform,
  );
  const baseScale = echelleDeBase(imageWidth, imageHeight, cropSize);
  const totalScale = baseScale * scale;
  const width = imageWidth * totalScale;
  const height = imageHeight * totalScale;
  const left = (cropSize - width) / 2 + translateX;
  const top = (cropSize - height) / 2 + translateY;
  return { width, height, left, top };
}
