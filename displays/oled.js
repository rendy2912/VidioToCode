// Preset display OLED (1-bit monokrom). "driver" dipakai generator untuk memilih library.
export const oledDisplays = {
  oled096:   { id: 'oled096',   label: 'OLED 0.96" SSD1306 128×64', w: 128, h: 64,  type: 'oled', driver: 'ssd1306' },
  oled13_64: { id: 'oled13_64', label: 'OLED 1.3" 128×64',          w: 128, h: 64,  type: 'oled', driver: 'sh1106'  },
  oled13_128:{ id: 'oled13_128',label: 'OLED 1.3" 128×128',         w: 128, h: 128, type: 'oled', driver: 'sh1107'  }
};
