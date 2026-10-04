// Encoder OLED: ImageData -> bitmap 1-bit (baris demi baris, MSB dulu, format Adafruit drawBitmap).
import { floydSteinberg } from './dither.js';

export function encodeMono(img, opts) {
  const { data, width: w, height: h } = img;
  const mode = opts.mode || 'mono';
  const n = w * h;
  const gray = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  if (mode === 'gray') { // auto-level: regangkan min..max ke 0..255
    let min = 255, max = 0;
    for (let i = 0; i < n; i++) { if (gray[i] < min) min = gray[i]; if (gray[i] > max) max = gray[i]; }
    const range = max - min || 1;
    for (let i = 0; i < n; i++) gray[i] = (gray[i] - min) * 255 / range;
  }
  const t = (mode === 'threshold' || mode === 'dither') ? opts.threshold : 128;
  let px;
  if (mode === 'dither') {
    px = floydSteinberg(gray, w, h, t);
  } else {
    px = new Uint8Array(n);
    for (let i = 0; i < n; i++) px[i] = gray[i] >= t ? 1 : 0;
  }
  if (opts.invert) for (let i = 0; i < n; i++) px[i] ^= 1;
  const bpr = (w + 7) >> 3;
  const bits = new Uint8Array(bpr * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[y * w + x]) bits[y * bpr + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return bits;
}
