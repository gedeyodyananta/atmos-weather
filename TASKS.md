# TASKS — ATMOS Weather Explorer

**Basis:** `SPEC.md` v1.1 (fitur F1–F13, AC-01…AC-22) + `UI-SPEC.md` v1.0 (token, komponen, wireframe, state)
**Catatan sumber:** acuan visual merujuk ke `UI-SPEC.md` §2 (token), §6–§16 (komponen), §17 (state), dan §5 (wireframe). Tugas bertanda **[UI]** diverifikasi terhadap wireframe/ukuran di dokumen tersebut.
**Target:** selesai dalam 1 hari kerja (±9,25 jam efektif + 0,75 jam buffer).
**Aturan:** satu tugas = satu commit yang bisa diverifikasi. Jangan menambah fitur di luar F1–F13.

**Legenda:** `P0` wajib · `P1` penting · `P2` opsional (dipotong pertama) · **[UI]** butuh keputusan visual.

---

## Ringkasan Milestone

| # | Milestone | Estimasi | SPEC ref | Gate (keluar dari milestone jika) |
|---|---|---|---|---|
| 1 | Project scaffold | 1,25 j | Iterasi 1, §5.1–5.5 | Dev server jalan, token CSS & komponen dasar siap |
| 2 | Integrasi API cuaca & AQI | 1,50 j | §4.2, §4.4, §5.4 | Data nyata masuk state via service, error ternormalisasi |
| 3 | Dashboard utama | 1,00 j | F1, §3.1 | Hero menampilkan data lokasi default dari API |
| 4 | Hourly & weekly forecast | 1,25 j | F2, F3 | 24 jam + 7 hari tampil dari array API |
| 5 | Pencarian lokasi & autocomplete | 0,75 j | F5 | Ganti kota mengubah seluruh panel |
| 6 | Atmospheric metrics & AQI | 1,25 j | F4, F13, §3.2 | 5 metrik + panel AQI + PM2.5/PM10 |
| 7 | Chart & favorite locations | 0,75 j | F8, F6 | Grafik 24 jam + favorit tambah/hapus |
| 8 | Celsius/Fahrenheit & localStorage | 0,50 j | F7, F11 | Reload mempertahankan satuan, favorit, kota |
| 9 | UI states & responsive testing | 0,60 j | F12, AC-11…AC-22 | Semua state & 3 breakpoint lulus |
| 10 | Security, build, deployment | 0,40 j | §6, §8, DoD | Build bersih, audit keamanan, deploy opsional |
| — | Buffer integrasi | 0,75 j | §10.2 | — |

**Jadwal usulan (elapsed):** 0:00 M1 → 1:15 M2 → 2:45 M3 → 3:45 M4 → 5:00 M5 → 5:45 M6 → 7:00 M7 → 7:45 M8 → 8:15 M9 → 8:50 M10 → 9:25 buffer/test akhir.

### Ketergantungan & catatan urutan
- M2 dikerjakan **sebelum** M3 agar dashboard langsung memakai data nyata (bukan dummy), sesuai §3.1 "tidak ada data statis tanpa label DEMO".
- `core/storage.js` versi minimal (baca/tulis aman) dibuat di M2 untuk `lastLocation`; penyempurnaan preferensi + favorit selesai di M8.
- M5 memakai `geocoding.js` yang sudah dibuat di M2; M5 hanya menambah UI + debounce.
- M9 mengeksekusi uji manual AC yang belum tertutup; M10 tidak memulai fitur baru.

---

## Milestone 1 — Project scaffold · 1,25 j

**Tujuan:** kerangka Vite + kontrak visual siap pakai, sehingga semua milestone berikutnya hanya menambah komponen.

### T1.1 Inisialisasi proyek & struktur direktori · P0 · 0,25 j
**Deskripsi:** Scaffold Vite (template vanilla), set `package.json`, `.gitignore`, dan struktur folder sesuai §5.2.
**AC:**
- [ ] `npm run dev` menyajikan halaman kosong tanpa error console.
- [ ] `npm run build` berhasil (belum ada optimasi).
- [ ] Struktur `src/{api,core,components,services,styles,utils}` ada dan tidak ada file kosong tak terpakai.
**Berkas:** `package.json`, `vite.config.js`, `.gitignore`, `index.html`, `src/main.js`

### T1.2 Design token & base styles · P0 · 0,4 j
**Deskripsi:** Implementasi palette, tipografi, border/shadow, spacing, fokus, dan larangan visual dari §5.5; self-host font Space Grotesk + Inter dengan fallback sistem.
**AC:**
- [ ] Semua 6 warna tersedia sebagai custom property dan dipakai lewat token (tidak ada hex lepas di komponen).
- [ ] Border 2–3 px, hard shadow tanpa blur, radius ≤ 6 px terlihat konsisten pada halaman contoh.
- [ ] `:focus-visible` 3 px ink + offset 2 px terlihat di tombol dan input.
- [ ] `prefers-reduced-motion` mematikan transisi.
**Berkas:** `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/components.css`, `public/assets/fonts/*`

### T1.3 Komponen dasar & layout shell · P0 · 0,35 j
**Deskripsi:** Tombol, badge, kartu, input, header; grid editorial asimetris + breakpoint 360/768/1280; halaman contoh untuk validasi visual.
**AC:**
- [ ] Hover `translate(-2px,-2px)` dan pressed `translate(2px,2px)` bekerja pada tombol/kartu.
- [ ] Tidak ada horizontal scroll pada 360 px.
- [ ] Header menampilkan brand, slot pencarian, dan slot toggle °C/°F (belum berfungsi).
**Berkas:** `index.html`, `src/styles/layout.css`, `src/styles/components.css`, `src/components/header.js`, `src/config/constants.js`

### T1.4 Aset ilustrasi & placeholder · P1 · 0,25 j
**Deskripsi:** Siapkan placeholder SVG lokal per kondisi cuaca (cerah, berawan, hujan, badai, salju, kabut) dan folder aset 3D; pemetaan nanti di `wmo.js`.
**AC:**
- [ ] Minimal 6 placeholder SVG lokal, ukuran < 20 KB total.
- [ ] Tidak ada permintaan aset ke CDN eksternal.
- [ ] Aset gagal dimuat tidak mematahkan layout (diuji dengan path salah).
**Berkas:** `public/assets/placeholder.svg`, `public/assets/weather/*`, `src/utils/wmo.js`

**Gate M1:** halaman contoh Neo-Brutalist tampil benar di 360/768/1280 px; tidak ada error console; `build` lulus.

---

## Milestone 2 — Integrasi API cuaca & kualitas udara (AQI) · 1,50 j

**Tujuan:** lapisan data lengkap dan teruji sebelum UI, termasuk normalisasi error dan isolasi kegagalan forecast vs AQI.

### T2.1 HTTP client & normalisasi error · P0 · 0,35 j
**Deskripsi:** `http.js` dengan timeout 10 dtk, `AbortController`, dan pemetaan error ke `{ code, retryable }`: `NETWORK`, `TIMEOUT`, `HTTP_4XX`, `HTTP_5XX`, `PARSE`, `EMPTY_DATA`. Parameter URL dibangun via `URLSearchParams`.
**AC:**
- [ ] Offline menghasilkan `NETWORK` dan `retryable: true`, bukan exception mentah.
- [ ] Respons non-JSON menghasilkan `PARSE`, bukan crash.
- [ ] Timeout 10 dtk membatalkan request dan melempar error terstruktur.
- [ ] Tidak ada `fetch` di luar `src/api/*` (dicek dengan pencarian).
**Berkas:** `src/api/http.js`, `src/config/constants.js`

### T2.2 Modul forecast & geocoding · P0 · 0,35 j
**Deskripsi:** `getForecast(location)` dengan parameter §4.2 dan `searchLocations(query)` (count=8, `language=id`), keduanya mengembalikan model domain, bukan respons mentah.
**AC:**
- [ ] Forecast memuat `current`, 24 entri hourly mulai jam berjalan, 7 entri daily.
- [ ] `uvIndex` dan `visibility` diambil dari array hourly (bukan `current`), `null` → `null`, bukan 0.
- [ ] Geocoding tanpa `results` mengembalikan array kosong (bukan error).
- [ ] Unit default Celsius/km/j dihormati; tidak ada konversi suhu di lapisan API.
**Berkas:** `src/api/forecast.js`, `src/api/geocoding.js`, `src/services/weatherService.js`

### T2.3 Modul air quality · P0 · 0,3 j
**Deskripsi:** `getAirQuality(location)` ke endpoint terpisah dengan `current=us_aqi,pm2_5,pm10`; `null` ditangani sebagai ketiadaan data.
**AC:**
- [ ] Endpoint memakai `timezone=auto` dan `domains=auto`.
- [ ] `us_aqi: null` → status `unavailable`, bukan angka 0.
- [ ] `pm25`/`pm10` `null` dipertahankan sebagai `null` sampai lapisan tampilan.
- [ ] Kategori **tidak** diambil dari API (dihitung klien di T6.1).
**Berkas:** `src/api/airQuality.js`, `src/utils/aqi.js` (kerangka), `src/services/weatherService.js`

### T2.4 Cache & orkestrasi paralel · P0 · 0,3 j
**Deskripsi:** Cache in-memory forecast (10 menit) dan AQI (15 menit); orkestrasi `Promise.allSettled` dengan slice state terpisah.
**AC:**
- [ ] Berpindah ke lokasi yang sama dalam < 10 menit tidak memicu request baru (cek Network).
- [ ] Kegagalan AQI **tidak** mengubah `status` forecast (diuji dengan blokir salah satu endpoint).
- [ ] `AbortController` membatalkan request lama saat lokasi berganti cepat.
**Berkas:** `src/services/weatherService.js`, `src/core/store.js`, `src/config/constants.js`

### T2.5 Bootstrap state & penyimpanan minimal · P0 · 0,2 j
**Deskripsi:** State tunggal (bentuk §5.3), subscriber/notify, dan `safeRead`/`safeWrite` untuk `lastLocation` + validasi bentuk data.
**AC:**
- [ ] State awal memuat `lastLocation` valid atau default Jakarta berlabel "Lokasi contoh".
- [ ] JSON rusak di LocalStorage tidak mematahkan boot.
- [ ] `store.dispatch` memicu render tepat satu kali per perubahan.
**Berkas:** `src/core/store.js`, `src/core/storage.js`, `src/main.js`

**Gate M2:** panggilan `weatherService.load()` di console menghasilkan model lengkap; error API tampil sebagai objek error terstruktur; tidak ada `fetch` tersebar.

---

## Milestone 3 — Dashboard utama · 1,00 j

### T3.1 Layout grid editorial & panel shell · P0 · 0,3 j
**Deskripsi:** Susun grid asimetris: main + rail kanan (desktop), satu kolom (mobile); kerangka semua panel (hero, hourly, daily, atmosfer, AQI, chart, favorit, peta) dengan ukuran berbeda-beda — bukan kartu seragam.
**AC:**
- [ ] 1280 px: rail kanan 320 px, main fleksibel; 768 px: dua kolom; 360 px: satu kolom.
- [ ] Setiap panel punya proporsi/tipe visual berbeda (tidak seragam).
- [ ] Tidak ada panel yang meluber keluar viewport.
**Berkas:** `index.html`, `src/styles/layout.css`, `src/main.js`

### T3.2 Hero cuaca saat ini · P0 · 0,4 j
**Deskripsi:** Nama lokasi, negara, tanggal + jam lokal (timezone lokasi), suhu besar, label kondisi dari WMO, feels-like, ilustrasi/placeholder, badge UV & angin.
**AC:**
- [ ] AC-01: lokasi default Jakarta, label "Lokasi contoh", tanggal lokal, suhu, kondisi, feels-like tampil.
- [ ] AC-18: memilih New York mengubah jam mengikuti zona waktu kota, bukan perangkat.
- [ ] Suhu 1 desimal; angka memakai Space Grotesk `tabular-nums`.
- [ ] Ikon cuaca berubah sesuai `weatherCode` (fallback placeholder untuk kode tak dikenal).
**Berkas:** `src/components/dashboard.js`, `src/utils/format.js`, `src/utils/wmo.js`, `src/styles/components.css`

### T3.3 Tombol perbarui & status pembaruan · P0 · 0,15 j
**Deskripsi:** Tombol "Perbarui" memicu reload tanpa memuat ulang halaman; label "Diperbarui HH.mm WIB" sesuai timezone lokasi.
**AC:**
- [ ] Klik "Perbarui" memicu satu request forecast + satu AQI.
- [ ] Timestamp diperbarui setelah sukses; saat gagal, timestamp lama tetap dengan penanda error.
**Berkas:** `src/components/header.js`, `src/components/dashboard.js`, `src/main.js`

### T3.4 Footer atribusi · P0 · 0,15 j
**Deskripsi:** Footer berisi atribusi Open-Meteo (CC BY 4.0) dan OpenStreetMap bila peta aktif; tanpa klaim "real-time".
**AC:**
- [ ] Atribusi terlihat di semua breakpoint dan tidak terpotong.
- [ ] Tidak ada teks "real-time" atau klaim presisi palsu.
**Berkas:** `index.html`, `src/styles/layout.css`

**Gate M3:** AC-01 dan AC-18 lulus; dashboard memakai data API nyata; label DEMO sudah tidak ada.

---

## Milestone 4 — Hourly & weekly forecast · 1,25 j

### T4.1 Katalog prakiraan per jam · P0 · 0,4 j
**Deskripsi:** Strip horizontal 24 jam: jam lokal, ikon, suhu, probabilitas hujan, angin; kartu pertama ditandai "Sekarang"; scroll horizontal dengan snap di mobile.
**AC:**
- [ ] AC-04: minimal 24 entri, urutan waktu naik, mulai jam berjalan.
- [ ] Entri pertama berlabel "Sekarang" dan menampilkan data `current`.
- [ ] Scroll horizontal berfungsi tanpa menimbulkan scroll halaman.
- [ ] Baris jam mengikuti timezone lokasi (AC-18).
**Berkas:** `src/components/hourly.js`, `src/utils/format.js`, `src/styles/components.css`

### T4.2 Prakiraan 7 hari · P0 · 0,4 j
**Deskripsi:** 7 baris/kartu non-seragam: hari & tanggal, ikon, bar rentang suhu maks–min, probabilitas hujan; hari ini ditandai.
**AC:**
- [ ] AC-05: tepat 7 kartu, tanggal berurutan, hari ini ditandai.
- [ ] Bar rentang suhu diskalakan dari min/max seluruh minggu dan tetap terbaca saat rentang sempit.
- [ ] Tidak ada data hari ke-8 atau kekosongan bila API mengembalikan 7 entri.
**Berkas:** `src/components/daily.js`, `src/utils/format.js`, `src/styles/components.css`

### T4.3 Pemetaan WMO & ilustrasi per kondisi · P1 · 0,2 j
**Deskripsi:** Tabel kode WMO → label Indonesia, nama aset, kategori warna aksen; fallback "Cuaca tidak diketahui".
**AC:**
- [ ] Minimal 10 kode umum (0,1,2,3,45,48,51,61,63,80,95) terpetakan.
- [ ] Kode tak dikenal tidak melempar error.
- [ ] Aset hilang jatuh ke placeholder lokal.
**Berkas:** `src/utils/wmo.js`, `public/assets/weather/*`

### T4.4 Loading/empty khusus hourly & daily · P1 · 0,25 j
**Deskripsi:** Skeleton per panel dan pesan "Data prakiraan tidak tersedia" bila array kosong, tanpa mengosongkan dashboard.
**AC:**
- [ ] Array hourly/daily kosong → panel menampilkan empty state, hero tetap tampil.
- [ ] Skeleton tidak menyebabkan layout shift > 100 px.
**Berkas:** `src/components/states.js`, `src/components/hourly.js`, `src/components/daily.js`

**Gate M4:** AC-04, AC-05 lulus; nilai suhu/jam cocok dengan respons API.

---

## Milestone 5 — Pencarian lokasi & autocomplete · 0,75 j

### T5.1 Input pencarian + debounce · P0 · 0,2 j
**Deskripsi:** Input di header (desktop) / sheet pencarian (mobile); debounce 350 ms, minimal 2 karakter, `AbortController` untuk request usang.
**AC:**
- [ ] Mengetik cepat "bandung" hanya menghasilkan satu request sukses.
- [ ] Query 1 karakter tidak memicu request; tampil petunjuk "Ketik minimal 2 huruf".
- [ ] Tombol clear mengosongkan input dan hasil.
**Berkas:** `src/components/header.js` atau `src/components/search.js` (baru, sesuai UI-SPEC bila ada), `src/core/events.js`

### T5.2 Daftar hasil autocomplete · P0 · 0,3 j
**Deskripsi:** Dropdown hasil geocoding: nama, wilayah administratif, negara; maksimal 8; navigasi keyboard (↑/↓/Enter/Esc); ARIA combobox.
**AC:**
- [ ] AC-02: memilih "Bandung, Indonesia" mengganti lokasi aktif.
- [ ] AC-03: seluruh panel (termasuk AQI) berubah; tidak ada sisa data kota sebelumnya.
- [ ] Keyboard: ↑/↓ memindah fokus, Enter memilih, Esc menutup tanpa memilih.
- [ ] `aria-expanded`/`aria-activedescendant` benar; fokus tidak hilang setelah memilih.
**Berkas:** `src/components/search.js`, `src/core/events.js`, `src/styles/components.css`

### T5.3 Empty & error pencarian · P0 · 0,15 j
**Deskripsi:** Empty state "Kota tidak ditemukan" dan error jaringan inline yang tidak menutupi input.
**AC:**
- [ ] AC-13: query "zzzqqq" menampilkan pesan kosong, input tetap bisa diedit.
- [ ] Error jaringan menampilkan pesan + opsi coba lagi hanya di area pencarian.
**Berkas:** `src/components/search.js`, `src/components/states.js`

### T5.4 Simpan lokasi terpilih · P0 · 0,1 j
**Deskripsi:** Menyimpan `lastLocation` ke LocalStorage setiap kali lokasi berubah (dasar untuk AC-10).
**AC:**
- [ ] Setelah memilih kota dan reload, kota tersebut termuat.
- [ ] Data tersimpan lolos validasi bentuk saat dibaca kembali.
**Berkas:** `src/core/storage.js`, `src/services/weatherService.js`

**Gate M5:** AC-02, AC-03, AC-13 lulus; dropdown dapat dioperasikan penuh dengan keyboard.

---

## Milestone 6 — Atmospheric metrics & AQI · 1,25 j

### T6.1 Fungsi ambang & label AQI · P0 · 0,25 j
**Deskripsi:** `utils/aqi.js`: ambang 0–50/51–100/101–150/151–200/201–300/301+, label Indonesia, warna token, pola, dan teks anjuran singkat (non-medis).
**AC:**
- [ ] Nilai batas 50/51, 100/101, 150/151, 200/201, 300/301 menghasilkan kategori benar (NFR-14).
- [ ] Warna dipetakan ke token palette, bukan hex baru.
- [ ] Setiap kategori punya label teks + pola (bukan warna saja).
**Berkas:** `src/utils/aqi.js`

### T6.2 Panel metrik atmosfer · P0 · 0,45 j
**Deskripsi:** 5 metrik (kelembapan, angin + arah mata angin, UV + kategori, tekanan, visibilitas) dalam blok asimetris; nilai `null` → "—".
**AC:**
- [ ] AC-06: nilai cocok dengan respons API (selisih hanya pembulatan).
- [ ] Arah angin tampil sebagai derajat + mata angin (mis. "NE · 45°").
- [ ] Kategori UV (Rendah/Sedang/Tinggi/Sangat Tinggi/Ekstrem) sesuai nilai.
- [ ] Visibilitas dikonversi meter → km dengan 1 desimal.
**Berkas:** `src/components/atmosphere.js`, `src/utils/format.js`, `src/styles/components.css`

### T6.3 Panel AQI · P0 · 0,4 j
**Deskripsi:** Kartu AQI: angka besar, label "US AQI", kategori + warna/pola, meter posisi 0–300+, dan nilai PM2.5/PM10 (µg/m³).
**AC:**
- [ ] AC-19: angka sama dengan `current.us_aqi` (dibulatkan), label "US AQI" terlihat.
- [ ] AC-20: kategori & warna/pola sesuai tabel §3.2 pada minimal 2 nilai berbeda.
- [ ] AC-21: PM2.5/PM10 tampil sesuai API; `null` → "—" + "tidak tersedia", bukan 0.
- [ ] Meter menandai posisi nilai dan tidak meluber untuk nilai > 300.
**Berkas:** `src/components/aqi.js`, `src/utils/aqi.js`, `src/styles/components.css`

### T6.4 State AQI terisolasi · P0 · 0,15 j
**Deskripsi:** Panel AQI punya loading/error/unavailable sendiri dengan tombol "Coba lagi" yang hanya memuat ulang AQI.
**AC:**
- [ ] AC-22: memblokir endpoint AQI tidak merusak dashboard; retry memulihkan tanpa reload.
- [ ] `us_aqi: null` → "Data kualitas udara tidak tersedia untuk lokasi ini".
**Berkas:** `src/components/aqi.js`, `src/components/states.js`, `src/services/weatherService.js`

**Gate M6:** AC-06, AC-19, AC-20, AC-21, AC-22 lulus; tidak ada angka 0 pengganti `null`.

---

## Milestone 7 — Temperature chart & favorite locations · 0,75 j

### T7.1 Grafik suhu 24 jam · P1 · 0,35 j
**Deskripsi:** Chart.js lazy-load; line chart suhu + feels-like, sumbu mengikuti satuan aktif, tooltip jam lokal, responsif, warna sesuai token.
**AC:**
- [ ] AC-07: 24 titik, sumbu wajar, tooltip jam + nilai.
- [ ] Grafik memuat ulang saat satuan berubah tanpa request API baru.
- [ ] Chart.js gagal dimuat → fallback tabel/placeholder + pesan, dashboard tetap hidup.
- [ ] Tinggi chart stabil di 360/768/1280 px (tanpa overflow).
**Berkas:** `src/components/chart.js`, `src/utils/format.js`, `src/styles/components.css`

### T7.2 Favorit: tambah, hapus, pindah · P0 · 0,3 j
**Deskripsi:** Tombol simpan lokasi aktif, daftar favorit di rail, klik item untuk berpindah, hapus per item, dedup berdasarkan `id`.
**AC:**
- [ ] AC-09: tambah lalu hapus berfungsi; menyimpan dua kali tidak membuat duplikat.
- [ ] Menyimpan lokasi yang sedang aktif menonaktifkan tombol simpan (state "Tersimpan").
- [ ] Favorit kosong → empty state dengan ajakan mencari kota.
- [ ] Maksimal 20 favorit; item ke-21 ditolak dengan pesan jelas.
**Berkas:** `src/components/favorites.js`, `src/core/events.js`, `src/core/storage.js`

### T7.3 Integrasi favorit dengan data · P1 · 0,1 j
**Deskripsi:** Berpindah favorit memakai cache bila tersedia; tanpa meminta suhu semua favorit (menjaga batas API).
**AC:**
- [ ] Berpindah antar dua favorit dalam 10 menit tidak menambah request berulang.
- [ ] Tidak ada request per item favorit saat render daftar.
**Berkas:** `src/components/favorites.js`, `src/services/weatherService.js`

**Gate M7:** AC-07, AC-09 lulus; grafik tidak memblokir render awal (lazy).

---

## Milestone 8 — Celsius/Fahrenheit & localStorage · 0,50 j

### T8.1 Toggle satuan · P0 · 0,2 j
**Deskripsi:** Kontrol °C/°F di header; semua tampilan suhu (hero, hourly, daily, chart, feels-like) memakai satu formatter.
**AC:**
- [ ] AC-08: nilai °F = (°C × 9/5) + 32 dalam toleransi 0,1; tidak ada request API baru.
- [ ] Label satuan berubah di semua panel, termasuk sumbu/tooltip grafik.
- [ ] Pilihan toggle punya `aria-pressed` dan bisa dioperasikan keyboard.
**Berkas:** `src/components/header.js`, `src/utils/format.js`, `src/core/events.js`

### T8.2 Persistensi preferensi & favorit · P0 · 0,2 j
**Deskripsi:** Simpan `atmos.v1.preferences` dan `atmos.v1.favorites`; validasi bentuk data saat baca; toleransi kuota penuh/mode privat.
**AC:**
- [ ] AC-10: setelah reload, satuan, favorit, dan kota terakhir tetap.
- [ ] AC-17: JSON rusak → data direset tanpa crash.
- [ ] Mode privat/kuota penuh → banner "Preferensi tidak dapat disimpan", aplikasi tetap berjalan.
**Berkas:** `src/core/storage.js`, `src/core/store.js`, `src/main.js`

### T8.3 Migrasi & versi key · P2 · 0,1 j
**Deskripsi:** Guard versi: key tidak dikenal diabaikan; struktur baru tidak merusak data lama.
**AC:**
- [ ] Key lama/tak dikenal tidak dibaca sebagai data valid.
- [ ] Tidak ada penulisan ke key di luar prefiks `atmos.v1.`.
**Berkas:** `src/core/storage.js`, `src/config/constants.js`

**Gate M8:** AC-08, AC-10, AC-17 lulus; tidak ada konversi suhu di luar `format.js`.

---

## Milestone 9 — UI states & responsive testing · 0,60 j (+ buffer untuk P2)

### T9.1 Loading, error, empty global · P0 · 0,2 j
**Deskripsi:** Skeleton konsisten, panel error dengan "Coba lagi", banner offline, toast netral untuk error tak terduga; `aria-live="polite"`.
**AC:**
- [ ] AC-11: Slow 3G menampilkan skeleton tanpa layout shift besar.
- [ ] AC-12: offline → pesan informatif + retry yang memulihkan tanpa reload.
- [ ] `unhandledrejection`/`error` global tidak menimpa UI, hanya log + toast.
- [ ] Status penting diumumkan ke screen reader.
**Berkas:** `src/components/states.js`, `src/main.js`, `src/styles/components.css`

### T9.2 Responsive pass & aksesibilitas · P0 · 0,25 j
**Deskripsi:** Audit 360/768/1280 px, target sentuh ≥ 44 px, kontras, fokus, urutan heading, `alt` ilustrasi, skip link.
**AC:**
- [ ] AC-14: tidak ada horizontal scroll tak diinginkan; AQI & hourly tetap terbaca.
- [ ] Semua kontrol dapat dijangkau Tab dengan fokus terlihat.
- [ ] Kontras teks ≥ 4.5:1 pada semua blok warna.
- [ ] `prefers-reduced-motion` menonaktifkan animasi ilustrasi.
**Berkas:** `src/styles/*.css`, `index.html`, `src/components/*.js`

### T9.3 Regression manual AC-01…AC-22 · P0 · 0,15 j
**Deskripsi:** Jalankan seluruh tabel AC §9 dengan Console terbuka; catat hasil per ID.
**AC:**
- [ ] AC-15: tidak ada `Uncaught`/`Unhandled rejection`.
- [ ] AC-16: atribusi tampil, tidak ada data statis tanpa label DEMO.
- [ ] Semua AC P0 berstatus lulus; kegagalan P1/P2 dicatat jujur, bukan disembunyikan.
**Berkas:** tidak ada perubahan kode (kecuali perbaikan bug yang ditemukan)

### T9.4 Weather map preview · P2 · 0,2 j (time-box, memakai buffer)
**Deskripsi:** Leaflet lazy-load + tile OSM + marker + zoom; satu kontrol layer hanya jika sumber layer stabil. Jika gagal → "Peta tidak tersedia" + koordinat.
**AC:**
- [ ] Peta hanya dimuat saat panel mendekati viewport; tidak membebani first paint.
- [ ] Tile gagal → fallback pesan, tanpa error console.
- [ ] Atribusi OSM tampil.
- [ ] Bila dipotong: panel tetap ada dengan keterangan, bukan peta palsu.
**Berkas:** `src/components/map.js`, `src/styles/components.css`, `index.html`

**Gate M9:** AC-11…AC-22 lulus; peta berstatus jelas (selesai / dipotong dengan alasan).

---

## Milestone 10 — Security, build, dan deployment · 0,40 j

### T10.1 Audit keamanan klien · P0 · 0,15 j
**Deskripsi:** Pastikan tidak ada secret, tidak ada `innerHTML` dengan data API, parameter di-encode, LocalStorage divalidasi, tanpa dependensi tak terpakai.
**AC:**
- [ ] `grep` tidak menemukan API key/token/`innerHTML` pada render data eksternal.
- [ ] Semua teks dari API ditulis via `textContent` (uji dengan nama kota berisi `<img onerror>`).
- [ ] `npm audit` tanpa kerentanan high/critical pada dependensi produksi.
- [ ] Tidak ada `eval`, `new Function`, atau skrip pihak ketiga (selain Chart.js/Leaflet).
**Berkas:** `src/components/*.js`, `src/api/*.js`, `package.json`, `.gitignore`

### T10.2 Build produksi & pemeriksaan ukuran · P0 · 0,15 j
**Deskripsi:** Jalankan build, cek warning, ukur payload awal dan pastikan aset/font ter-hash serta path benar.
**AC:**
- [ ] `npm run build` berhasil tanpa warning kritis.
- [ ] Payload awal (HTML+CSS+JS inti) < 250 KB sebelum chart/peta.
- [ ] `npm run preview` menyajikan aplikasi identik dengan dev (tanpa 404 aset).
- [ ] Chart.js dan Leaflet berada di chunk terpisah (lazy).
**Berkas:** `vite.config.js`, `package.json`, `dist/*` (hasil build)

### T10.3 Deployment statis (hanya bila diminta) · P2 · 0,10 j
**Deskripsi:** Deploy `dist/` ke hosting statis (Netlify/Vercel/Cloudflare Pages) tanpa backend; konfigurasi SPA fallback tidak diperlukan karena single page.
**AC:**
- [ ] URL publik memuat halaman tanpa error console dan aset 200.
- [ ] Tidak ada variabel rahasia di konfigurasi hosting.
- [ ] Atribusi tetap tampil di build produksi.
- [ ] Jika tidak diminta: langkah ini dilewati dan dicatat sebagai belum dilakukan.
**Berkas:** `dist/*`, konfigurasi hosting (mis. `netlify.toml`), `README.md`

**Gate M10:** build bersih, audit aman, status deploy jujur.

---

## Matriks Traceability

| Fitur SPEC | Milestone | AC terkait |
|---|---|---|
| F1 Dashboard | M3 | AC-01, AC-18 |
| F2 Hourly | M4 | AC-04 |
| F3 Daily 7 hari | M4 | AC-05 |
| F4 Metrik atmosfer | M6 | AC-06 |
| F5 Pencarian lokasi | M5 | AC-02, AC-03, AC-13 |
| F6 Favorit | M7 | AC-09 |
| F7 Toggle °C/°F | M8 | AC-08 |
| F8 Grafik suhu | M7 | AC-07 |
| F9 Ilustrasi cuaca | M1, M4 | — (visual) |
| F10 Weather map (P2) | M9 | — (opsional) |
| F11 LocalStorage | M2, M5, M8 | AC-10, AC-17 |
| F12 UI states | M9 (dipakai di semua M) | AC-11, AC-12, AC-15 |
| F13 AQI | M2, M6 | AC-19, AC-20, AC-21, AC-22 |

---

## Aturan Pemotongan (jika waktu mepet)

Urutkan pemotongan persis seperti `SPEC.md` §10.1:

1. **T9.4 peta (P2)** — panel tetap ada, isi keterangan "Peta tidak tersedia".
2. **T4.3 aset 3D final (P1)** — pakai placeholder SVG.
3. **T7.1 grafik (P1)** — hapus panel chart; hourly tetap menyajikan suhu.
4. **T6.3 detail AQI lanjutan** (polutan dominan/bar sub-indeks) — angka AQI, kategori, PM2.5/PM10 tetap.
5. **T8.3 migrasi key & polish animasi** — sisakan fokus/pressed state.

**Tidak boleh dipotong:** M1 (tanpa scaffold tidak ada aplikasi), T2.1–T2.4, M3, M4, M5, T6.1–T6.4, M7 favorit, M8.1–M8.2, M9.1–M9.3, T10.1–T10.2.

---

## Checklist Akhir Hari

- [ ] AC-01…AC-22 dijalankan manual dan hasilnya dicatat (lulus/gagal/dilewati).
- [ ] Tidak ada error JavaScript tak tertangani di Console.
- [ ] Satuan, favorit, dan lokasi terakhir bertahan setelah reload.
- [ ] Tidak ada angka 0 yang menggantikan data `null` (UV, visibility, AQI, PM2.5/PM10).
- [ ] Atribusi Open-Meteo (dan OSM bila peta aktif) tampil.
- [ ] `npm run build` lulus; payload awal < 250 KB; tidak ada secret di repo.
- [ ] Status F10/F8/F9 dilaporkan jujur (selesai / versi minimal / dipotong).
