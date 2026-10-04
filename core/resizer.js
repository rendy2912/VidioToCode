// Resize frame video ke resolusi display (fit / fill / stretch) + brightness & contrast.
export function createResizer(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return {
    w, h,
    grab(video, mode) {
      const vw = video.videoWidth, vh = video.videoHeight;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      let dw = w, dh = h;
      if (mode !== 'stretch') {
        const k = mode === 'fill' ? Math.max(w / vw, h / vh) : Math.min(w / vw, h / vh);
        dw = vw * k;
        dh = vh * k;
      }
      ctx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return ctx.getImageData(0, 0, w, h);
    }
  };
}

export function applyAdjust(data, brightness, contrast) {
  if (brightness === 0 && contrast === 0) return;
  const C = contrast * 2.55;
  const f = (259 * (C + 255)) / (255 * (259 - C));
  const b = brightness * 2.55;
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = f * (data[i]     - 128) + 128 + b;
    data[i + 1] = f * (data[i + 1] - 128) + 128 + b;
    data[i + 2] = f * (data[i + 2] - 128) + 128 + b;
  }
}
