# ATMOS — Weather Explorer

ATMOS adalah aplikasi web cuaca statis berbahasa Indonesia dengan antarmuka Neo-Brutalist. Pengguna dapat melihat kondisi cuaca saat ini, prakiraan per jam dan 7 hari, mencari kota, menyimpan daftar lokasi/favorit, mengubah satuan suhu, serta membagikan ringkasan cuaca via WhatsApp.

Aplikasi berjalan sepenuhnya di browser: tanpa backend, tanpa akun, tanpa API key, dan tanpa database. Semua data cuaca diambil langsung dari API publik Open-Meteo.

## Daftar fitur yang terimplementasi

- **Dashboard cuaca lokasi aktif** — nama kota, wilayah/negara, tanggal dan jam lokal sesuai zona waktu kota, suhu besar, kondisi cuaca (label WMO), suhu terasa, kelembapan, angin + arah mata angin, indeks UV, dan US AQI.
- **Prakiraan per jam** — hingga 24 entri mulai jam berjalan; tiap entri berisi jam, ikon kondisi, suhu, probabilitas hujan, dan angin.
- **Prakiraan 7 hari** — satu baris per hari dengan ikon, bar rentang suhu minimum–maksimum, probabilitas hujan, dan penanda "Hari ini".
- **Pencarian kota (autocomplete)** — minimal 2 karakter, debounce 350 ms, maksimal 8 hasil, navigasi keyboard (↑/↓/Enter/Esc), empty state "Kota tidak ditemukan", dan error state dengan tombol coba lagi.
- **Daftar lokasi tersimpan** — tambah dari hasil pencarian, pilih untuk dijadikan lokasi aktif, tandai/hapus favorit, hapus dari daftar, serta menampilkan suhu dan AQI tiap lokasi.
- **Filter dan pengurutan** — filter Semua Lokasi / Favorit / Negara / Zona Waktu, diurutkan berdasarkan nama, suhu, atau AQI; filter dan pencarian dapat dipakai bersamaan.
- **Toggle satuan °C/°F** — hero, feels-like, kartu lokasi, per jam, 7 hari, dan pesan bagikan ikut berubah tanpa request API baru; pilihan disimpan di localStorage.
- **Bagikan via WhatsApp** — tautan `wa.me` berisi ringkasan cuaca yang di-encode; tombol dinonaktifkan saat data belum lengkap atau koordinat tidak valid.
- **Status loading/error/empty** — skeleton per panel, pesan error dengan tombol "Coba lagi", dan fallback yang tidak mematahkan dashboard.
- **Ilustrasi cuaca lokal** — SVG dibuat dari kode WMO di dalam kode aplikasi, tanpa aset atau CDN eksternal.

Belum diimplementasikan dan tidak diklaim ada: grafik suhu (Chart.js), panel metrik atmosfer 5 tile, peta Leaflet/OpenStreetMap, autentikasi, dan sinkronisasi data antarperangkat.

## Tech stack

| Lapisan | Teknologi |
|---|---|
| Bahasa | JavaScript vanilla (ES Modules), HTML5, CSS3 |
| Build/dev server | Vite 8 |
| Test | Vitest 5 (environment Node) |
| UI | DOM API native + CSS custom properties; tanpa framework UI |
| Data | REST JSON Open-Meteo (forecast, geocoding, air quality) via `fetch` |
| Penyimpanan | `localStorage` browser |
| Dependency produksi | Tidak ada (hanya `vite` dan `vitest` sebagai devDependencies) |

Tipografi memakai variabel `Space Grotesk`/`Inter` dengan fallback font sistem; tidak ada font atau aset yang diunduh dari CDN.

## Prasyarat

- Node.js `^20.19.0` atau `>=22.12.0` untuk build (kebutuhan Vite 8).
- Node.js `22.12+` (atau 24+) untuk `npm test` (kebutuhan Vitest 5).
- Koneksi internet saat aplikasi digunakan.

## Instalasi

```bash
npm ci        # instalasi reproduktif dari package-lock.json
npm run dev   # dev server, default http://localhost:5173
```

Bila `npm ci` belum bisa dipakai, gunakan `npm install`.

## Menjalankan test

```bash
npm test
```

Perintah ini menjalankan Vitest sekali jalan (`vitest run`) dan mencakup 4 file test:

- `src/utils/locationFilters.test.js` — pencarian case-insensitive, filter scope, kombinasi filter + sort, pengurutan kosong/null.
- `src/utils/weatherShare.test.js` — validasi data share, encoding karakter khusus, dan keamanan URL.
- `src/core/storage.test.js` — validasi lokasi, parser localStorage (JSON rusak/tipe salah/batas ukuran), preferensi °C/°F, batas 20 lokasi.
- `src/api/security.test.js` — validasi respons API, penolakan payload tidak valid, dan pembentukan URL/parameter.

## Build produksi

```bash
npm run build
```

Hasil build statis berada di `dist/` (`index.html`, satu file CSS, satu file JS yang sudah di-hash). Untuk memeriksa hasil build secara lokal:

```bash
npm run preview
```

## Panduan deployment

Aplikasi ini adalah satu halaman statis, sehingga dapat diunggah ke hosting statis apa pun (Netlify, Vercel, Cloudflare Pages, GitHub Pages, Nginx, dan sejenisnya).

1. Jalankan `npm ci` lalu `npm test` dan `npm run build`.
2. Unggah **isi** direktori `dist/` sebagai root situs. Jangan mengunggah `src/`, `node_modules/`, atau file konfigurasi pengembangan.
3. Tidak diperlukan server aplikasi, database, API key, atau environment variable.
4. Tidak diperlukan aturan SPA fallback/rewrite karena hanya ada satu halaman. Aset dirujuk dengan path absolut (`/assets/...`), jadi deploy di root domain; bila ingin di subpath, buat konfigurasi Vite dan set `base` yang sesuai sebelum build.
5. Disarankan mengatur header keamanan di hosting (mis. `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`) dan cache panjang untuk aset ber-hash, serta `no-cache` untuk `index.html`. Repositori ini tidak menyertakan konfigurasi hosting.

## Sumber data dan atribusi

| Data | Endpoint | Keterangan |
|---|---|---|
| Prakiraan cuaca | `https://api.open-meteo.com/v1/forecast` | current, hourly, daily; satuan Celsius dan km/jam |
| Geocoding kota | `https://geocoding-api.open-meteo.com/v1/search` | maksimal 8 hasil, bahasa Indonesia |
| Kualitas udara | `https://air-quality-api.open-meteo.com/v1/air-quality` | `us_aqi`, PM2.5, PM10 |

- **Open-Meteo** — data cuaca, pencarian lokasi, dan kualitas udara. Lisensi [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Atribusi "Data cuaca: Open-Meteo (CC BY 4.0)" tampil di footer dengan tautan ke [open-meteo.com](https://open-meteo.com/) dan lisensi.
- **OpenStreetMap** — saat ini **tidak digunakan** karena fitur peta belum diimplementasikan; aplikasi tidak memuat tile, Leaflet, atau data OSM apa pun. Bila peta ditambahkan di kemudian hari, atribusi "© OpenStreetMap contributors" wajib terlihat dan tautan mengacu ke [openstreetmap.org/copyright](https://www.openstreetmap.org/copyright).
- Aplikasi tidak memakai API key, token, atau kredensial pihak ketiga. Endpoint publik di-hardcode di `src/config/constants.js`.
- Permintaan dibatasi cache in-memory (forecast 10 menit, AQI 15 menit), debounce pencarian, dan `AbortController` untuk membatalkan request usang.

## Penyimpanan browser (localStorage) dan batasannya

Daftar lokasi/favorit dan preferensi satuan **hanya tersimpan di localStorage browser lokal** pada origin tempat aplikasi dibuka. Tidak ada backend, autentikasi, atau sinkronisasi.

| Key | Isi | Batas/perilaku |
|---|---|---|
| `atmos.v1.preferences` | `{ unit: "c" \| "f", updatedAt }` | Satuan selain `c`/`f` dianggap tidak valid dan dikembalikan ke `c` |
| `atmos.v1.locations` | Daftar lokasi tersimpan beserta status favorit | Maksimal 20 lokasi; duplikat `id` dibuang, UI juga menolak koordinat yang sama |
| `atmos.v1.lastLocation` | Lokasi terakhir yang dipilih | Dipakai saat aplikasi dibuka kembali |

Keterbatasan penting:

- **Lokal per browser dan per origin.** Data tidak muncul di browser lain, perangkat lain, mode incognito, atau domain lain. Membersihkan data situs akan menghapus favorit, lokasi tersimpan, lokasi terakhir, dan pilihan satuan.
- **Tidak ada autentikasi/akun.** Tidak ada login, profil pengguna, atau penyimpanan di server; siapa pun yang memakai browser tersebut dapat melihat daftar lokasi yang tersimpan.
- **Bukan untuk data sensitif.** Hanya nama/koordinat kota, status favorit, dan satuan suhu yang disimpan. Tidak ada token, kredensial, atau koordinat GPS perangkat. Respons API tidak disimpan ke localStorage (hanya cache memori selama tab terbuka).
- **Kuota penuh/mode privat.** Penulisan yang gagal ditangani tanpa crash; aplikasi memakai nilai default, tetapi preferensi mungkin tidak bertahan setelah reload.
- **Data rusak atau terlalu besar.** JSON tidak valid, tipe data salah, atau nilai melebihi 256 KB dihapus otomatis dan diganti default.
- **Validasi saat dibaca.** Setiap lokasi divalidasi (nama, negara, latitude −90…90, longitude −180…180) sebelum dipakai.

## Keterbatasan lain

- Membutuhkan internet; tidak ada mode offline, service worker, atau PWA installable.
- Nilai AQI dapat `null` untuk sebagian koordinat; UI menampilkan "tidak tersedia", bukan angka 0.
- Tanpa backend/proxy, ketersediaan dan kuota mengikuti ketentuan Open-Meteo.
- Lokasi awal adalah contoh Kuta Selatan, Bali, dan diberi label "Lokasi contoh" sampai pengguna memilih kota.
- Data yang ditampilkan bergantung pada respons API; aplikasi tidak menyimpan riwayat cuaca.

## Struktur direktori

```text
src/
├─ api/         # HTTP client + pemetaan respons forecast/geocoding/AQI
├─ components/  # hero, hourly, daily, pencarian, daftar lokasi, ikon SVG
├─ config/      # endpoint, TTL cache, batas penyimpanan, konfigurasi share
├─ core/        # store tunggal + helper localStorage
├─ services/    # orkestrasi forecast + AQI, cache, pembatalan request
└─ utils/       # format angka/tanggal, ambang AQI, filter lokasi, share URL
```
