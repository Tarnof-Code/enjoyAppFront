/** Convertit un ArrayBuffer image en URI data pour `<Image source={{ uri }} />`. */
export function arrayBufferToDataUri(buffer: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  const base64 = globalThis.btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}
