// Encoder TFT: ImageData -> Uint16Array RGB565.
export function encodeRGB565(img) {
  const d = img.data;
  const n = img.width * img.height;
  const out = new Uint16Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = ((d[i * 4] & 0xF8) << 8) | ((d[i * 4 + 1] & 0xFC) << 3) | (d[i * 4 + 2] >> 3);
  }
  return out;
}
