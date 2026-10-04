// Generator VideoFrame.h (data frame asli dari video) dan Main.ino untuk Arduino.
const hex = (v, digits) => '0x' + v.toString(16).toUpperCase().padStart(digits, '0');

export function generateHeader(frames, display, fps) {
  const { w, h, type } = display;
  const tft = type === 'tft';
  const T = tft ? 'uint16_t' : 'uint8_t';
  const digits = tft ? 4 : 2;
  const perLine = tft ? 12 : 16;
  const parts = [];
  parts.push('// VideoFrame.h - dibuat oleh Video to Code Converter\n' +
    '// Display : ' + display.label + ' ' + w + 'x' + h + (tft ? ' (RGB565)' : ' (1-bit monokrom)') + '\n' +
    '#pragma once\n#include <Arduino.h>\n\n' +
    '#define VIDEO_WIDTH ' + w + '\n#define VIDEO_HEIGHT ' + h + '\n' +
    '#define VIDEO_FPS ' + fps + '\n#define FRAME_COUNT ' + frames.length + '\n' +
    '#define FRAME_INTERVAL_MS (1000UL / VIDEO_FPS)\n');
  for (let f = 0; f < frames.length; f++) {
    const a = frames[f];
    const lines = [];
    for (let i = 0; i < a.length; i += perLine) {
      const end = Math.min(i + perLine, a.length);
      const row = [];
      for (let j = i; j < end; j++) row.push(hex(a[j], digits));
      lines.push('  ' + row.join(', '));
    }
    parts.push('const ' + T + ' frame_' + f + '[] PROGMEM = {\n' + lines.join(',\n') + '\n};\n');
  }
  const names = [];
  for (let f = 0; f < frames.length; f++) names.push('frame_' + f);
  parts.push('const ' + T + '* const video_frames[] PROGMEM = {\n  ' + names.join(',\n  ') + '\n};\n');
  return parts.join('\n');
}

export function buildMain(display, opts) {
  return display.type === 'tft' ? tftMain(display, opts) : oledMain(display, opts);
}

function oledMain(display, opts) {
  const d = display.driver;
  const sh = d !== 'ssd1306';
  const lib = d === 'ssd1306' ? 'Adafruit_SSD1306.h' : 'Adafruit_SH110X.h';
  const cls = { ssd1306: 'Adafruit_SSD1306', sh1106: 'Adafruit_SH1106G', sh1107: 'Adafruit_SH1107' }[d];
  const ctor = d === 'sh1107' ? '(VIDEO_WIDTH, VIDEO_HEIGHT, &Wire)' : '(VIDEO_WIDTH, VIDEO_HEIGHT, &Wire, -1)';
  const begin = sh ? 'display.begin(OLED_ADDR, true)' : 'display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)';
  const white = sh ? 'SH110X_WHITE' : 'SSD1306_WHITE';
  const libName = sh ? 'Adafruit SH110X' : 'Adafruit SSD1306';
  return '// Main.ino - ' + opts.name + ' | ' + display.label + '\n' +
'// Library (Library Manager): Adafruit GFX Library + ' + libName + '\n' +
'#include <Wire.h>\n#include <Adafruit_GFX.h>\n#include <' + lib + '>\n#include "VideoFrame.h"\n\n' +
'#define OLED_ADDR 0x3C   // coba 0x3D jika layar tidak menyala\n' +
cls + ' display' + ctor + ';\n\n' +
'void setup() {\n  Serial.begin(115200);\n' + (opts.wire ? '  ' + opts.wire + '\n' : '') +
'  if (!' + begin + ') {\n    Serial.println(F("OLED tidak ditemukan, cek kabel I2C"));\n    for (;;) delay(1000);\n  }\n' +
'  display.clearDisplay();\n  display.display();\n}\n\n' +
'void loop() {\n  static uint16_t frame = 0;\n  static uint32_t last = 0;\n  uint32_t now = millis();\n' +
'  if (now - last < FRAME_INTERVAL_MS) return;\n  last = now;\n\n' +
'  const uint8_t* data = (const uint8_t*)pgm_read_ptr(&video_frames[frame]);\n' +
'  display.clearDisplay();\n' +
'  display.drawBitmap(0, 0, data, VIDEO_WIDTH, VIDEO_HEIGHT, ' + white + ');\n' +
'  display.display();\n\n  frame = (frame + 1) % FRAME_COUNT;   // ulangi video\n}\n';
}

function tftMain(display, opts) {
  const st = display.driver === 'st7735';
  const rot = display.w > display.h ? 1 : 0;
  return '// Main.ino - ' + opts.name + ' | ' + display.label + '\n' +
'// Library (Library Manager): Adafruit GFX Library + ' + (st ? 'Adafruit ST7735 and ST7789 Library' : 'Adafruit ILI9341') + '\n' +
'#include <SPI.h>\n#include <Adafruit_GFX.h>\n#include <' + (st ? 'Adafruit_ST7735.h' : 'Adafruit_ILI9341.h') + '>\n#include "VideoFrame.h"\n\n' +
'// Pin SPI: ' + opts.spiNote + '\n' +
'#define TFT_CS  ' + opts.cs + '\n#define TFT_DC  ' + opts.dc + '\n#define TFT_RST ' + opts.rst + '\n\n' +
(st ? 'Adafruit_ST7735 tft(TFT_CS, TFT_DC, TFT_RST);\n' : 'Adafruit_ILI9341 tft(TFT_CS, TFT_DC, TFT_RST);\n') + '\n' +
'void setup() {\n  Serial.begin(115200);\n' +
(st ? '  tft.initR(INITR_BLACKTAB);   // jika warna/posisi salah coba INITR_GREENTAB atau INITR_REDTAB\n' : '  tft.begin();\n') +
'  tft.setRotation(' + rot + ');\n  tft.fillScreen(0x0000);\n}\n\n' +
'void loop() {\n  static uint16_t frame = 0;\n  static uint32_t last = 0;\n  uint32_t now = millis();\n' +
'  if (now - last < FRAME_INTERVAL_MS) return;\n  last = now;\n\n' +
'  const uint16_t* data = (const uint16_t*)pgm_read_ptr(&video_frames[frame]);\n' +
'  tft.drawRGBBitmap(0, 0, data, VIDEO_WIDTH, VIDEO_HEIGHT);\n\n' +
'  frame = (frame + 1) % FRAME_COUNT;   // ulangi video\n}\n';
}

export function generateArduinoMain(display) {
  return buildMain(display, {
    name: 'Arduino (Uno/Nano/Mega)', wire: '',
    cs: 10, dc: 9, rst: 8, spiNote: 'SCK=13, MOSI=11 (Uno/Nano)'
  });
}
