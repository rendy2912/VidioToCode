// Ekstraksi frame: lompat (seek) ke waktu i/fps lalu panggil onFrame(i).
export function seekTo(video, t) {
  return new Promise(resolve => {
    const max = Math.max(0, video.duration - 0.001);
    const target = Math.min(Math.max(0, t), max);
    if (Math.abs(video.currentTime - target) < 0.0005 && video.readyState >= 2) { resolve(); return; }
    let timer;
    const done = () => { clearTimeout(timer); video.removeEventListener('seeked', done); resolve(); };
    video.addEventListener('seeked', done);
    timer = setTimeout(done, 5000);
    video.currentTime = target;
  });
}

export async function extractFrames(video, fps, total, onFrame, onProgress, shouldCancel) {
  for (let i = 0; i < total; i++) {
    if (shouldCancel()) return false;
    await seekTo(video, i / fps);
    await onFrame(i);
    onProgress(i + 1, total);
    await new Promise(r => setTimeout(r, 0)); // beri napas ke UI
  }
  return true;
}
