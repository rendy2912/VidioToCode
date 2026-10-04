// Display custom: pengguna menentukan lebar, tinggi, dan mode warna ('oled' = 1-bit, 'tft' = RGB565).
export function customDisplay(w, h, type) {
  const isTft = type === 'tft';
  return {
    id: 'custom', label: 'Custom', w, h, type: isTft ? 'tft' : 'oled',
    driver: isTft ? (Math.max(w, h) <= 160 ? 'st7735' : 'ili9341') : 'ssd1306'
  };
}
