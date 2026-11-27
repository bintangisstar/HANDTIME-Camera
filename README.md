# ✋ HANDTIME Camera

Photo booth kecil di browser. Pilih template **3–4 foto**, lalu tunjukkan
**1–5 jari** dan tahan untuk memicu hitung mundur serta jepretan otomatis.

Dibangun dengan **React 19 + TypeScript + Vite 8 + MediaPipe Tasks Vision**.
Tampilan baru memakai gaya sticker/photobooth: krem hangat, outline tebal,
aksen pink–mint–butter, plus dukungan mode gelap.

## ✨ Fitur

| Fitur | Keterangan |
|-------|-----------|
| 🖐️ **Deteksi jari** | Landmark MediaPipe, akurat untuk tangan miring (jarak ke pergelangan, bukan posisi vertikal) |
| ⏱️ **Hold 0,6 detik** | Progress bar menunjukkan kapan timer akan mulai |
| ⏳ **Hitung mundur** | Ring + angka besar, bunyi tik, dan label “Senyum!” di detik terakhir |
| 📸 **Foto otomatis** | Flash + suara shutter, hasil dicerminkan seperti preview |
| 🎞️ **Template photobooth** | Pilih template 3–4 frame, isi satu per satu dengan gesture, lalu simpan sebagai satu gambar (JPEG) |
| 🎲 **Ide pose** | Saran pose acak supaya sesi foto nggak kaku |
| 🔊 **Suara opsional** | Tik, chime, dan shutter dari WebAudio; preferensi disimpan |
| 🧯 **Error state jelas** | Izin kamera ditolak, kamera dipakai aplikasi lain, atau model gagal dimuat |
| 🌗 **Mode gelap** | Mengikuti `prefers-color-scheme` |
| ♿ **Aman akses** | Fokus terlihat, label ARIA, `prefers-reduced-motion` dihormati |
| 📦 **Build satu file** | `dist/index.html` mandiri, JS/CSS/font sudah inline |

## 🚀 Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`, izinkan akses kamera, lalu angkat jari.

## 📦 Build untuk hosting statis

```bash
npm run build
```

Hasil build ada di `dist/`. JavaScript, CSS, dan font di-inline ke
`dist/index.html`; folder `dist/templates/` juga harus ikut di-upload karena
berisi gambar frame photobooth.

## 📝 Catatan

- Kamera hanya aktif di `localhost` atau HTTPS (kebijakan browser).
- MediaPipe (WASM + model `hand_landmarker.task`) dimuat dari CDN, jadi
  koneksi internet tetap diperlukan saat aplikasi dibuka.
- Deteksi mencoba delegate **GPU**, lalu otomatis jatuh ke **CPU** kalau WebGL
  tidak tersedia.
- Semua proses deteksi dan penyimpanan foto terjadi di browser; tidak ada
  upload ke server.

## 🗂️ Struktur

```
src/
├── components/
│   ├── CameraView.tsx       # kamera, deteksi, timer, capture
│   ├── CountdownOverlay.tsx # ring + angka hitung mundur
│   ├── GestureGuide.tsx     # jumlah jari live + progress hold
│   ├── PhotoResult.tsx      # hasil photostrip + confetti
│   ├── PoseCard.tsx         # ide pose acak
│   ├── StartScreen.tsx      # hero + cara pakai
│   └── Topbar.tsx           # brand + toggle suara
├── hooks/
│   ├── useGestureTimer.ts   # countdown berbasis wall-clock
│   └── useSound.ts          # WebAudio (tik, chime, shutter)
├── utils/fingerCounter.ts   # hitung jari + smoothing
├── utils/boothTemplates.ts  # template, slot foto, dan komposisi hasil
├── App.tsx                  # layar start ↔ booth
├── App.css                  # seluruh style UI
├── index.css                # token warna, font, reset
└── main.tsx
```
