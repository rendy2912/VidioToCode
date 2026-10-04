// Preview di canvas (resolusi asli display) + pemutar animasi.
export function decodeFrame(frame, display) {
  const { w, h } = display;
  const img = new ImageData(w, h);
  const d = img.data;
  if (display.type === 'oled') {
    const bpr = (w + 7) >> 3;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const on = frame[y * bpr + (x >> 3)] & (0x80 >> (x & 7));
        const o = (y * w + x) * 4;
        d[o] = d[o + 1] = d[o + 2] = on ? 255 : 0;
        d[o + 3] = 255;
      }
    }
  } else {
    for (let i = 0; i < w * h; i++) {
      const v = frame[i];
      const r = (v >> 11) & 31, g = (v >> 5) & 63, b = v & 31;
      d[i * 4]     = (r << 3) | (r >> 2);
      d[i * 4 + 1] = (g << 2) | (g >> 4);
      d[i * 4 + 2] = (b << 3) | (b >> 2);
      d[i * 4 + 3] = 255;
    }
  }
  return img;
}

export function showFrame(canvas, frame, display) {
  if (canvas.width !== display.w || canvas.height !== display.h) {
    canvas.width = display.w;
    canvas.height = display.h;
  }
  canvas.getContext('2d').putImageData(decodeFrame(frame, display), 0, 0);
}

export class Player {
  constructor() { this.timer = null; }
  get playing() { return this.timer !== null; }
  start(fps, step) {
    this.stop();
    this.timer = setInterval(step, 1000 / fps);
  }
  stop() {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
  }
}
