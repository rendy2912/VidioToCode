# Video to Code Converter

Website untuk mengubah video menjadi kumpulan frame untuk display mikrokontroler (OLED / TFT) dan menghasilkan kode Arduino / ESP32. Berjalan 100% di browser: HTML + CSS + JavaScript biasa, tanpa backend, tanpa npm, tanpa build. Video tidak pernah diupload.

## Cara menjalankan secara lokal
Proyek memakai ES Modules, jadi **tidak bisa** dibuka dengan klik dua kali `index.html` (diblokir browser). Gunakan server lokal sederhana:

- Python: buka terminal di folder ini, jalankan `python -m http.server 8000`, lalu buka `http://localhost:8000`
- Atau VS Code: ekstensi **Live Server** → klik kanan `index.html` → *Open with Live Server*

## Cara upload ke GitHub
1. Buat repository baru di github.com (misal `video-to-code`), set Public.
2. Klik **Add file → Upload files**, drag semua isi folder `VideoToCode` (termasuk folder `core`, `displays`, `encoders`, `generators`).
3. Klik **Commit changes**. Pastikan `index.html` ada di root repository.

## Cara mengaktifkan GitHub Pages
1. Repository → **Settings → Pages**.
2. *Source*: **Deploy from a branch**, Branch: `main`, folder `/ (root)` → **Save**.
3. Tunggu 1–2 menit, alamat website muncul di halaman yang sama (`https://username.github.io/nama-repo/`).

## Cara menggunakan converter
1. **Pilih Video** (MP4/WebM sesuai dukungan browser).
2. Pilih **Display** dan **Board** (ESP32 / Arduino). Untuk Custom isi Width, Height, dan Color mode.
3. Pilih **FPS**. Jumlah frame = durasi × FPS.
4. Atur scaling (Fit/Fill/Stretch), brightness, contrast. OLED: pilih Monochrome/Threshold/Grayscale/Dithering. TFT: warna dipertahankan jadi RGB565.
5. Cek preview, tekan **CONVERT VIDEO**, tunggu progress bar penuh.
6. Gunakan **Copy Code**, **Download VideoFrame.h**, **Download Main.ino**, atau **Download ZIP**.

## Display yang didukung
| Display | Resolusi | Output | Driver di Main.ino |
|---|---|---|---|
| OLED 0.96" SSD1306 | 128×64 | 1-bit | SSD1306 |
| OLED 1.3" | 128×64 | 1-bit | SH1106 |
| OLED 1.3" | 128×128 | 1-bit | SH1107 |
| TFT 1.8" | 160×128 | RGB565 | ST7735 |
| TFT 2.4" | 240×320 | RGB565 | ILI9341 |
| Custom | bebas (8–512) | 1-bit / RGB565 | SSD1306 / ST7735 / ILI9341 |

Jika modul Anda memakai chip berbeda (misalnya OLED 1.3" yang ternyata SSD1306), ubah bagian `include`, deklarasi `display`, dan `begin` di `Main.ino`.

## Cara menggunakan Main.ino
1. Ekstrak ZIP. Folder `Main` berisi `Main.ino` dan `VideoFrame.h` (nama folder harus sama dengan nama `.ino`).
2. Buka `Main/Main.ino` di Arduino IDE.
3. Install library (Sketch → Include Library → Manage Libraries), lihat komentar paling atas `Main.ino`.
4. Pilih board dan port, klik Upload.

Pin default OLED (I2C): ESP32 SDA=21, SCL=22; Uno SDA=A4, SCL=A5. Pin default TFT: ESP32 CS=5, DC=2, RST=4 (SCK=18, MOSI=23); Uno CS=10, DC=9, RST=8 (SCK=13, MOSI=11). Ubah `#define` jika kabel Anda berbeda.

## Library Arduino yang diperlukan
- OLED SSD1306: **Adafruit GFX Library** + **Adafruit SSD1306**
- OLED SH1106 / SH1107: **Adafruit GFX Library** + **Adafruit SH110X**
- TFT ST7735: **Adafruit GFX Library** + **Adafruit ST7735 and ST7789 Library**
- TFT ILI9341: **Adafruit GFX Library** + **Adafruit ILI9341**

## Keterbatasan browser
- Maksimum 1500 frame per konversi (hemat memori); peringatan muncul untuk FPS > 15, video > 60 detik, > 300 frame, dan resolusi > 1920 px.
- Format video bergantung codec browser (MP4 H.264 dan WebM paling aman).
- Frame diambil dengan seek, jadi video panjang/beresolusi tinggi bisa lambat.
- Flash mikrokontroler terbatas: Arduino Uno hanya ±28 KB (cukup beberapa frame OLED saja), ESP32 ±1.3 MB pada partisi default. Peringatan ditampilkan jika data diperkirakan terlalu besar.
- Tidak ada audio. Library Adafruit SSD1306 hanya mendukung ukuran layar tertentu (mis. 128×64, 128×32); ukuran custom lain mungkin tidak bisa dikompilasi.
- Tampilan kode di textarea dipotong jika sangat panjang; Copy/Download tetap berisi data lengkap.
