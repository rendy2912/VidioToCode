// Generator Main.ino untuk ESP32 (memakai pembuat kode bersama dari arduino.js).
import { buildMain } from './arduino.js';

export function generateESP32Main(display) {
  return buildMain(display, {
    name: 'ESP32', wire: 'Wire.begin(21, 22);   // SDA=21, SCL=22',
    cs: 5, dc: 2, rst: 4, spiNote: 'SCK=18, MOSI=23 (VSPI default ESP32)'
  });
}
