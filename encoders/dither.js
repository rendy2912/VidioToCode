// Floyd–Steinberg dithering. Input: gray (Float32Array 0..255). Output: Uint8Array berisi 0/1 per pixel.
export function floydSteinberg(gray, w, h, t) {
  const buf = Float32Array.from(gray);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = buf[i];
      const nv = old >= t ? 255 : 0;
      out[i] = nv ? 1 : 0;
      const err = old - nv;
      if (x + 1 < w) buf[i + 1] += err * 7 / 16;
      if (y + 1 < h) {
        if (x > 0) buf[i + w - 1] += err * 3 / 16;
        buf[i + w] += err * 5 / 16;
        if (x + 1 < w) buf[i + w + 1] += err * 1 / 16;
      }
    }
  }
  return out;
}
