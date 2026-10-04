// Memuat file video lokal ke elemen <video> (tanpa upload ke server).
export function loadVideo(file, prev) {
  return new Promise((resolve, reject) => {
    if (prev && prev.url) URL.revokeObjectURL(prev.url);
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      if (!isFinite(video.duration) || video.duration <= 0) {
        reject(new Error('Durasi video tidak valid.'));
        return;
      }
      resolve({ video, url, name: file.name, size: file.size,
        duration: video.duration, width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Browser tidak bisa membaca video ini. Coba format MP4 (H.264) atau WebM.'));
    };
    video.src = url;
  });
}

export function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1);
  return m > 0 ? m + 'm ' + sec + 's' : sec + 's';
}

export function supportedFormats() {
  const v = document.createElement('video');
  const list = [['MP4', 'video/mp4'], ['WebM', 'video/webm'], ['OGG', 'video/ogg'], ['MOV', 'video/quicktime']];
  return list.filter(f => v.canPlayType(f[1]) !== '').map(f => f[0]);
}
