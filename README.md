# ✋ HANDTIME Camera

Timer foto otomatis berbasis gesture tangan. Tunjukkan sejumlah jari ke kamera,
HANDTIME akan membaca jumlahnya, menjalankan hitung mundur selama jumlah jari
tersebut, lalu mengambil foto secara otomatis.

Dibangun dengan **React 19 + TypeScript + Vite 8 + MediaPipe Tasks Vision**.

## ✨ Fitur

| Fitur | Keterangan |
|-------|-----------|
| 🖐️ **Deteksi jari** | Hand landmark MediaPipe, maksimal 1 tangan |
| ⏱️ **Timer dari gesture** | Tahan gesture 0,5 detik → timer mulai sesuai jumlah jari |
| 📸 **Foto otomatis** | Foto diambil begitu hitung mundur selesai (hasil mirror) |
| 🖼️ **Preview & simpan** | Pratinjau hasil, tombol RETAKE dan SAVE PHOTO |
| 📦 **Build satu file** | `dist/index.html` mandiri, semua JS/CSS sudah inline |

## 🚀 Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`, lalu izinkan akses kamera.

## 📦 Build satu file mandiri

```bash
npm run build
```

Hasilnya **satu file**: `dist/index.html` (JavaScript dan CSS di-inline lewat
`vite-plugin-singlefile`). File itu bisa langsung dibuka di browser atau
di-upload ke hosting statis apa pun tanpa folder `assets`.

> Build juga bisa dijalankan lewat `npm run preview` untuk mengecek hasilnya.

## 📝 Catatan

- Kamera hanya aktif di `localhost` atau HTTPS (kebijakan browser).
- MediaPipe (WASM + model `hand_landmarker.task`) dimuat dari CDN, jadi
  koneksi internet tetap diperlukan saat aplikasi dibuka.
- Deteksi memakai delegate GPU; browser tanpa dukungan WebGL bisa gagal
  menginisialisasi hand landmarker.

## 🗂️ Struktur

```
src/
├── components/
│   ├── CameraView.tsx    # kamera, deteksi tangan, capture
│   └── TimerDisplay.tsx  # tampilan hitung mundur
├── hooks/useGestureTimer.ts
├── utils/fingerCounter.ts
├── App.tsx
└── main.tsx
```
