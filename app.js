import { loadVideo, formatTime, supportedFormats } from './core/video-loader.js';
import { extractFrames, seekTo } from './core/frame-extractor.js';
import { createResizer, applyAdjust } from './core/resizer.js';
import { showFrame, Player } from './core/preview.js';
import { oledDisplays } from './displays/oled.js';
import { tftDisplays } from './displays/tft.js';
import { customDisplay } from './displays/custom.js';
import { encodeMono } from './encoders/monochrome.js';
import { encodeRGB565 } from './encoders/rgb565.js';
import { generateHeader, generateArduinoMain } from './generators/arduino.js';
import { generateESP32Main } from './generators/esp32.js';
import { buildZip, buildProjectFiles, downloadBlob, downloadText, copyText } from './generators/files.js';

const $ = id => document.getElementById(id);
const PRESETS = { ...oledDisplays, ...tftDisplays };
const LIM = { maxFrames: 1500, maxBytes: 96 * 1024 * 1024, warnFrames: 300, warnDuration: 60, warnFps: 15, warnRes: 1920 };
const state = { video: null, info: null, frames: [], files: null, zipFiles: null,
  busy: false, cancel: false, live: 0, resizer: null, idx: 0, out: null, timer: null };
const player = new Player();

function init() {
  const sel = $('display');
  for (const k in PRESETS) sel.add(new Option(PRESETS[k].label, k));
  sel.add(new Option('Custom', 'custom'));
  const f = supportedFormats();
  $('formats').textContent = 'Format yang didukung browser ini: ' + (f.length ? f.join(', ') : '-');

  $('pickBtn').onclick = () => $('file').click();
  $('file').onchange = onFile;
  document.querySelectorAll('.s').forEach(el => el.addEventListener('input', onSettings));
  $('convertBtn').onclick = convert;
  $('cancelBtn').onclick = () => { state.cancel = true; };
  $('prevBtn').onclick = () => { player.stop(); showIdx(state.idx - 1); };
  $('nextBtn').onclick = () => { player.stop(); showIdx(state.idx + 1); };
  $('playBtn').onclick = () => player.start(state.out.fps, () => showIdx(state.idx + 1));
  $('stopBtn').onclick = () => player.stop();
  $('tab').onchange = showCode;
  $('copyBtn').onclick = () => copyText(state.files[$('tab').value]);
  $('dlHeader').onclick = () => downloadText('VideoFrame.h', state.files.header);
  $('dlMain').onclick = () => downloadText('Main.ino', state.files.main);
  $('dlZip').onclick = () => downloadBlob('VideoToCode-Arduino.zip', buildZip(state.zipFiles));
  update();
}

function getDisplay() {
  const v = $('display').value;
  if (v === 'custom') {
    const cl = x => Math.min(512, Math.max(8, parseInt(x, 10) || 8));
    return customDisplay(cl($('cw').value), cl($('ch').value), $('cmode').value);
  }
  return PRESETS[v];
}

function readSettings() {
  return { scale: $('scale').value, brightness: +$('brightness').value, contrast: +$('contrast').value,
    mode: $('omode').value, threshold: +$('threshold').value, invert: $('invert').checked };
}

function processFrame(video, display, s) {
  if (!state.resizer || state.resizer.w !== display.w || state.resizer.h !== display.h) {
    state.resizer = createResizer(display.w, display.h);
  }
  const img = state.resizer.grab(video, s.scale);
  applyAdjust(img.data, s.brightness, s.contrast);
  return display.type === 'oled' ? encodeMono(img, s) : encodeRGB565(img);
}

function bytesPerFrame(d) { return d.type === 'oled' ? ((d.w + 7) >> 3) * d.h : d.w * d.h * 2; }

function estimate(d) {
  const box = $('warnings');
  box.innerHTML = '';
  const add = (cls, txt) => { const li = document.createElement('li'); li.className = cls; li.textContent = txt; box.appendChild(li); };
  if (!state.info) { $('frameEst').textContent = 'Pilih video untuk melihat perkiraan jumlah frame.'; return false; }
  const fps = +$('fps').value;
  const dur = state.info.duration;
  const frames = Math.max(1, Math.floor(dur * fps));
  const bytes = frames * bytesPerFrame(d);
  $('frameEst').textContent = 'Jumlah frame = durasi × FPS = ' + dur.toFixed(2) + ' × ' + fps + ' ≈ ' + frames +
    ' frame (± ' + (bytes / 1024).toFixed(1) + ' KB data)';
  let ok = true;
  if (frames > LIM.maxFrames) { add('err', 'Terlalu banyak frame (' + frames + '). Batas maksimum ' + LIM.maxFrames + '. Turunkan FPS atau pakai video lebih pendek.'); ok = false; }
  if (bytes > LIM.maxBytes) { add('err', 'Ukuran data melebihi batas memori browser (' + (LIM.maxBytes >> 20) + ' MB).'); ok = false; }
  if (ok && frames > LIM.warnFrames) add('warn', 'Jumlah frame besar (' + frames + '): konversi lama dan kode sangat panjang.');
  if (fps > LIM.warnFps) add('warn', 'FPS tinggi (' + fps + '): ukuran data besar, mikrokontroler mungkin tidak sanggup secepat itu.');
  if (dur > LIM.warnDuration) add('warn', 'Video panjang (' + formatTime(dur) + '). Disarankan di bawah ' + LIM.warnDuration + ' detik.');
  if (state.info.width > LIM.warnRes || state.info.height > LIM.warnRes) add('warn', 'Resolusi video besar (' + state.info.width + '×' + state.info.height + '): seek frame bisa lambat.');
  const limit = $('board').value === 'esp32' ? 1300000 : 28000;
  if (bytes > limit) add('warn', 'Data (~' + (bytes / 1024).toFixed(0) + ' KB) kemungkinan melebihi flash ' + ($('board').value === 'esp32' ? 'ESP32 (~1.3 MB, partisi default)' : 'Arduino (~28 KB di Uno)') + '.');
  return ok;
}

function update() {
  const d = getDisplay();
  const tft = d.type === 'tft';
  $('customOpts').hidden = $('display').value !== 'custom';
  $('oledOpts').hidden = tft;
  $('tftNote').hidden = !tft;
  $('resInfo').textContent = d.w + '×' + d.h + ' • ' + (tft ? 'RGB565 (16-bit, berwarna)' : '1-bit monokrom');
  $('bv').textContent = $('brightness').value;
  $('cv').textContent = $('contrast').value;
  $('tv').textContent = $('threshold').value;
  const ok = estimate(d);
  $('convertBtn').disabled = !state.info || !ok || state.busy;
}

function onSettings() {
  invalidate();
  update();
  clearTimeout(state.timer);
  state.timer = setTimeout(refreshLive, 150);
}

function setOutputButtons(on) {
  ['copyBtn', 'dlHeader', 'dlMain', 'dlZip'].forEach(id => { $(id).disabled = !on; });
  ['prevBtn', 'nextBtn', 'playBtn', 'stopBtn'].forEach(id => { $(id).disabled = !on; });
}

function invalidate() {
  if (state.busy || !state.frames.length) return;
  player.stop();
  state.frames = [];
  state.files = null;
  state.zipFiles = null;
  $('code').value = '';
  setOutputButtons(false);
  $('progText').textContent = 'Pengaturan berubah. Tekan CONVERT VIDEO lagi.';
  $('bar').style.width = '0';
}

async function onFile() {
  const file = $('file').files[0];
  if (!file) return;
  player.stop();
  try {
    state.info = await loadVideo(file, state.info);
  } catch (e) {
    state.info = null;
    $('fileInfo').textContent = 'Gagal: ' + e.message;
    update();
    return;
  }
  state.video = state.info.video;
  state.frames = [];
  setOutputButtons(false);
  $('code').value = '';
  const i = state.info;
  $('fileInfo').textContent = i.name + ' • durasi ' + formatTime(i.duration) + ' • ' + i.width + '×' + i.height + ' • ' + (i.size / 1048576).toFixed(1) + ' MB';
  $('progText').textContent = 'Siap. Atur pengaturan lalu tekan CONVERT VIDEO.';
  update();
  refreshLive();
}

async function refreshLive() {
  if (!state.video || state.busy || state.frames.length) return;
  const token = ++state.live;
  const d = getDisplay();
  const t = Math.min(1, state.info.duration / 2);
  await seekTo(state.video, t);
  if (token !== state.live || state.busy || state.frames.length) return;
  showFrame($('canvas'), processFrame(state.video, d, readSettings()), d);
  $('pvInfo').textContent = 'Preview contoh (detik ' + t.toFixed(1) + ') • ' + d.w + '×' + d.h + ' • belum dikonversi';
}

function showIdx(i) {
  const n = state.frames.length;
  if (!n) return;
  state.idx = (i + n) % n;
  showFrame($('canvas'), state.frames[state.idx], state.out.display);
  $('pvInfo').textContent = 'Frame ' + (state.idx + 1) + ' / ' + n + ' • ' + state.out.fps + ' FPS • ' + state.out.display.w + '×' + state.out.display.h;
}

function showCode() {
  if (!state.files) return;
  const t = state.files[$('tab').value];
  $('code').value = t.length > 150000
    ? t.slice(0, 150000) + '\n\n// ... (tampilan dipotong; Copy Code / Download berisi data LENGKAP)'
    : t;
}

async function convert() {
  if (!state.video || state.busy) return;
  const display = getDisplay();
  const fps = +$('fps').value;
  const total = Math.max(1, Math.floor(state.info.duration * fps));
  const s = readSettings();
  const board = $('board').value;
  player.stop();
  state.busy = true;
  state.cancel = false;
  state.frames = [];
  $('convertBtn').disabled = true;
  $('cancelBtn').disabled = false;
  setOutputButtons(false);
  $('code').value = '';
  const frames = [];
  const done = await extractFrames(state.video, fps, total,
    i => { frames.push(processFrame(state.video, display, s)); },
    (n, t) => {
      $('bar').style.width = (n / t * 90).toFixed(1) + '%';
      $('progText').textContent = 'Ekstraksi → resize → proses → encode: frame ' + n + ' / ' + t;
    },
    () => state.cancel);
  $('cancelBtn').disabled = true;
  if (!done) {
    state.busy = false;
    $('progText').textContent = 'Dibatalkan.';
    $('bar').style.width = '0';
    update();
    refreshLive();
    return;
  }
  $('progText').textContent = 'Membuat kode...';
  await new Promise(r => setTimeout(r, 30));
  const header = generateHeader(frames, display, fps);
  const main = board === 'esp32' ? generateESP32Main(display) : generateArduinoMain(display);
  state.files = { header, main };
  state.zipFiles = buildProjectFiles(state.files, display, fps, frames.length, board === 'esp32' ? 'ESP32' : 'Arduino');
  state.frames = frames;
  state.out = { display, fps };
  state.busy = false;
  $('bar').style.width = '100%';
  $('progText').textContent = 'Selesai: ' + frames.length + ' frame siap. Data frame berasal dari video Anda.';
  setOutputButtons(true);
  showCode();
  showIdx(0);
  update();
}

init();
