# ATMOS — Weather & Haze Explorer

[English](README.md) | [Bahasa Indonesia](README.id.md)

> **Bahasa antarmuka:** UI ATMOS dilokalkan dalam Bahasa Indonesia sebagai bahasa default, dengan pilihan Bahasa Inggris. Bahasa Indonesia menjadi bahasa utama untuk pemantauan kualitas udara dan kabut asap (karhutla). Dokumen ini adalah README Bahasa Indonesia; versi Bahasa Inggris tersedia di [`README.md`](README.md).

ATMOS adalah dashboard cuaca dan kualitas udara berbasis browser dengan gaya visual Neo-Brutalist/technical. Aplikasi ini menyatukan kondisi saat ini, prakiraan per jam dan tujuh hari, US AQI, indikator kabut asap karhutla, rincian polutan, data angin dan matahari, serta alat lokasi tersimpan dalam satu halaman responsif.

Seluruh aplikasi berjalan di sisi klien. Tidak ada backend, database, sistem login, API key, atau dependency produksi. Data cuaca, geocoding, dan kualitas udara diambil langsung dari API publik Open-Meteo.

---

## Gambaran Proyek & Tujuan

ATMOS dibuat untuk menjawab dua pertanyaan yang saling berkaitan secara cepat:

1. **Bagaimana cuaca di sini sekarang, dan apa yang akan terjadi berikutnya?**
2. **Apakah udara cukup aman untuk aktivitas luar ruang normal, terutama saat kabut asap atau karhutla?**

Antarmuka menekankan informasi yang padat dan mudah dipindai, bukan dashboard kartu generik. Setiap nilai berasal dari respons API nyata atau estimasi yang dijelaskan; aplikasi tidak menyertakan data cuaca statis dan tidak mengubah data yang tidak tersedia menjadi angka nol.

Antarmuka mendukung:

- Teks UI Bahasa Indonesia (default) dan Bahasa Inggris.
- Tampilan satuan Celsius/Fahrenheit.
- Tata letak desktop, tablet, dan mobile.
- Penyimpanan preferensi dan lokasi tersimpan hanya di browser lokal.

Aplikasi ini adalah situs satu halaman statis. Tidak ada server-side rendering, router, akun pengguna, atau layanan sinkronisasi.

---

## Latar Belakang & Konteks

ATMOS — Weather Explorer dibangun dalam sesi pengembangan cepat satu hari (one-day vibe coding sprint) pada pelatihan **CHAT (Creative Hub for App Talent)** yang diselenggarakan oleh [Kementerian Ekonomi Kreatif (Ekraf)](https://ekraf.go.id/) Republik Indonesia.

Sesi ini dirancang sebagai latihan produk dari hulu ke hilir: mengubah arahan awal menjadi aplikasi web yang berjalan dan dapat didemonstrasikan dalam satu hari. Dalam konteks ini, vibe coding berarti penggunaan iterasi berbantuan AI untuk mempercepat eksplorasi arah produk, sementara implementasinya tetap berpijak pada kebutuhan yang eksplisit, data API nyata, perilaku responsif, dan pemeriksaan yang dapat diulang. Hasilnya adalah prototipe fungsional, bukan klaim kesiapan produksi atau produk resmi pemerintah.

Konteks Indonesia membentuk cakupan proyek. Episode kabut asap dan kebakaran hutan/lahan (karhutla) membuat kualitas udara menjadi perhatian praktis sehari-hari, sehingga ATMOS menyatukan sinyal cuaca dan kualitas udara dalam satu antarmuka, bukan sebagai dua dashboard terpisah. Proyek ini juga menjadi sarana untuk melatih atribusi data yang jelas, penanganan nilai yang tidak tersedia secara jujur, serta komunikasi dua bahasa Indonesia/Inggris dalam tenggat yang singkat.

---

## Fitur Utama

### Dashboard cuaca

- **Hero kondisi saat ini:** nama lokasi, wilayah/negara, tanggal dan jam lokal, suhu besar, label kondisi WMO, suhu terasa, chip UV/angin/matahari terbenam/tekanan, serta metrik kelembapan/angin/UV/tekanan.
- **Tema hero mengikuti cuaca:** warna hero mengikuti kategori kondisi WMO dan fase siang/malam (cerah, berawan, hujan, badai, salju, kabut, atau fallback). Ilustrasi SVG lokal berganti antara siang dan malam.
- **Ilustrasi cuaca SVG lokal:** matahari, bulan, awan, hujan, badai, salju, dan kabut digambar langsung di kode. Tidak ada permintaan ikon, gambar, atau CDN eksternal.
- **Prakiraan per jam:** hingga 24 entri mulai jam berjalan, masing-masing berisi jam lokal, ikon kondisi, suhu, probabilitas hujan, dan kecepatan angin.
- **Prakiraan tujuh hari:** kondisi harian, bar rentang suhu minimum–maksimum, probabilitas hujan, UV maksimum, dan penanda “hari ini”.
- **Grafik suhu 24 jam:** SVG native dengan garis suhu, garis putus-putus suhu terasa, dan bar probabilitas hujan. Nilai suhu mengikuti satuan °C/°F yang dipilih.
- **Panel atmosfer:** kelembapan, tekanan permukaan, jarak pandang, indeks UV (dengan UV maksimum hari ini bila tersedia), titik embun, dan tutupan awan.
- **Busur matahari:** posisi matahari saat ini antara terbit dan terbenam, fase siang/malam, waktu terbit, waktu terbenam, dan panjang hari.
- **Kompas angin:** dial visual 16 titik, arah mata angin delapan arah yang terlokalisasi beserta derajat (misalnya “Tenggara · 135°”), kecepatan angin, hembusan, dan perkiraan **arah pergerakan asap** (downwind).
- **Ticker kondisi/peringatan:** hanya dihasilkan dari data cuaca/AQI nyata. Cakupannya meliputi probabilitas hujan dalam enam jam ke depan, badai, UV, angin/hembusan kencang, AQI, dan selisih suhu harian. Jika tidak ada peringatan, ticker menampilkan ringkasan singkat kondisi saat ini.
- **Perbarui dan status data:** status strip menampilkan waktu pembaruan terakhir dan status cache; tombol perbarui meminta data forecast dan kualitas udara yang baru.

### Pemantauan kualitas udara dan kabut asap

- **Hero status kabut asap:** kartu utama yang latarnya berubah mengikuti kategori US AQI (hijau, kuning, oranye, merah, atau ungu pekat). Kartu menampilkan kategori AQI saat ini, PM2.5, dan panduan praktis.
- **Panduan masker dan kesehatan:** memetakan tingkat AQI ke “Tanpa Masker”, “Masker Medis”, atau “Wajib N95/KF94”, ditambah panduan aktivitas luar ruang dan peringatan untuk kelompok sensitif.
- **Estimasi paparan setara rokok:** menampilkan estimasi informatif PM2.5 dengan rumus `PM2.5 ÷ 22`, dibulatkan satu desimal. Ini adalah estimasi, bukan diagnosis medis.
- **Panel AQI:** nilai US AQI, badge dan deskripsi kategori terlokalisasi, serta meter posisi 0–300 bersegmen dengan penanda. Nilai di atas 300 ditempatkan di ujung skala visual.
- **Bento polutan dan visibilitas:** enam kartu untuk PM2.5, PM10, karbon monoksida (CO), nitrogen dioksida (NO2), ozon (O3), dan jarak pandang. Setiap kartu menampilkan nilai, label status, progress bar terhadap ambang referensi WHO tetap, dan ambang tersebut.
- **Ambang referensi tetap yang dipakai UI:**
  - PM2.5: 15 µg/m³
  - PM10: 45 µg/m³
  - CO: 4 mg/m³ (nilai mentah API dalam µg/m³ dikonversi untuk tampilan)
  - NO2: 25 µg/m³
  - O3: 100 µg/m³
  - Jarak pandang: 10 km (semakin tinggi semakin baik)
- **Status polutan:** nilai sampai 50% ambang ditandai aman; di atas 50% hingga 100% ditandai mendekati ambang; di atas 100% ditandai melebihi ambang. Jarak pandang memakai perbandingan terbalik karena visibilitas yang lebih tinggi lebih baik.
- **Tren kualitas udara 24 jam:** SVG native dengan batang AQI berwarna sesuai kategori, garis PM2.5 pada skala kanan terpisah, label jam lokal, penanda puncak AQI, dan area **jam udara terbaik**.
- **Jam udara terbaik:** tiga jam berurutan dengan rata-rata AQI terendah. Badge menampilkan jam mulai dan selesai dalam format `HH.mm – HH.mm`.
- **Kegagalan AQI terisolasi:** permintaan forecast dan kualitas udara berjalan independen. Jika data kualitas udara gagal atau tidak tersedia, dashboard cuaca tetap dapat digunakan dan panel terkait AQI menampilkan status serta aksi coba lagi sendiri.

### Preset karhutla dan perbandingan kualitas udara

- **Chip tambah cepat kota:** Palangkaraya (Kalimantan Tengah), Pontianak (Kalimantan Barat), Pekanbaru (Riau), dan Jambi. Memilih chip akan menambahkan atau memilih lokasi tersebut melalui alur lokasi tersimpan biasa, tanpa membuat duplikat.
- **Leaderboard kualitas udara:** membandingkan lokasi tersimpan yang memiliki AQI numerik, lalu menampilkan lokasi terbersih dan terburuk beserta AQI dan kategorinya. Leaderboard tampil setelah minimal dua lokasi tersimpan memiliki nilai AQI.

### Lokasi, preferensi, dan berbagi

- **Pencarian kota:** geocoding Open-Meteo dengan minimal 2 karakter, debounce 350 ms, maksimal 8 hasil, navigasi keyboard (↑/↓/Enter/Escape), metadata hasil, empty state, dan tombol coba lagi saat error. Permintaan lama dibatalkan.
- **Geolokasi perangkat:** tombol “Lokasi saya” memakai Geolocation API browser. Koordinat dibulatkan empat desimal dan tidak ada layanan reverse geocoding.
- **Lokasi tersimpan:** hingga 20 lokasi, dengan pemilihan lokasi aktif, penandaan/hapus favorit, penghapusan lokasi, dan kontrol berbagi. Daftar menampilkan data suhu dan AQI yang tersedia.
- **Filter dan pengurutan:** filter semua lokasi, favorit, negara, atau zona waktu; urutkan berdasarkan nama, suhu terdingin, suhu terpanas, atau AQI terbaik. Filter dan query pencarian dapat dikombinasikan.
- **Pergantian bahasa:** kamus UI Indonesia dan Inggris, termasuk label, error, tanggal, kategori AQI, dan teks berbagi. Bahasa yang dipilih disimpan secara lokal.
- **Pergantian satuan suhu:** °C/°F untuk seluruh tampilan suhu, tanpa mengambil ulang data cuaca. Satuan yang dipilih disimpan secara lokal.
- **Berbagi via WhatsApp:** membuat tautan `wa.me` berisi lokasi terpilih, suhu saat ini, kondisi, dan AQI. Aksi dinonaktifkan jika data cuaca/AQI yang dibutuhkan belum lengkap.
- **Status memuat, kosong, dan error:** panel memakai skeleton atau pesan eksplisit, dan aksi coba lagi dibatasi pada sumber data yang terdampak bila memungkinkan.
- **Ketahanan data lokal:** data tersimpan yang tidak valid atau terlalu besar dibuang dengan aman, bukan membuat halaman rusak.

### Antarmuka responsif dan aksesibel

- CSS mobile-first dengan tata letak panel yang menyesuaikan pada sekitar 560 px, 640 px, 1024 px, dan 1280 px.
- Pada layar lebar, panel lokasi menjadi rail samping yang sticky; pada layar lebih kecil, panel mengikuti dashboard dalam alur satu kolom.
- Kartu per jam dapat digulir horizontal di dalam stripnya sendiri, sementara halaman dirancang tanpa overflow horizontal yang disengaja.
- Menyediakan skip link, gaya fokus yang terlihat, heading semantik, label/live region ARIA, penanganan `prefers-reduced-motion`, dan dukungan keyboard untuk pencarian serta kontrol.
- Suite test mencakup smoke test DOM, tetapi proyek ini **tidak** mengklaim telah menjalani audit WCAG formal atau pengujian regresi visual di browser.

---

## Tech Stack

| Area | Teknologi |
|---|---|
| Bahasa | JavaScript (ES Modules), HTML5, CSS3 |
| UI | DOM API native, SVG native, CSS custom properties; tanpa framework UI |
| Build tool / dev server | Vite 8.3.8 |
| Test | Vitest 5.1.1 |
| Lingkungan test DOM | linkedom 0.18.15 |
| Data | REST API publik Open-Meteo melalui `fetch` |
| Penyimpanan | `localStorage` browser |
| Font | Space Grotesk dan Inter variable WOFF2 yang di-self-host |
| Dependency produksi | Tidak ada |

Vite dan Vitest hanya dependency pengembangan. Hasil produksi berupa HTML, CSS, JavaScript, dan file font statis. Grafik dan ilustrasi cuaca dibuat dengan SVG native; tidak ada Chart.js, Leaflet, atau library grafik/peta lain yang dimuat.

### Kebutuhan versi

- Gunakan rilis Node.js yang didukung Vitest 5: **22.12+, 24+, atau 26+**. Node.js 24 LTS adalah lingkungan yang terverifikasi. Vite 8 juga menerima Node `20.19+`, tetapi test runner memerlukan rentang Vitest yang lebih ketat.
- npm dipakai untuk instalasi dependency dan menjalankan script.
- Browser modern dengan ES modules, `fetch`, `AbortController`, `Intl`, dan `localStorage` diperlukan.

Repositori ini diverifikasi secara lokal dengan Node.js **24.14.1** dan npm **11.11.0**.

---

## Instalasi & Pengembangan Lokal

### 1. Masuk ke direktori proyek

```bash
cd atmos
```

### 2. Pasang dependency

```bash
npm ci
```

`npm ci` memasang versi dependency yang persis sesuai `package-lock.json`. Jika lockfile tidak dapat digunakan di lingkungan Anda, gunakan `npm install` sebagai fallback.

### 3. Jalankan development server

```bash
npm run dev
```

Buka URL yang dicetak Vite. Default-nya biasanya `http://localhost:5173`.

Tidak diperlukan file `.env`, API key, database, atau proses backend. Endpoint API bersifat publik dan didefinisikan di `src/config/constants.js`.

### Script yang tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan Vite development server dengan hot module replacement |
| `npm test` | Menjalankan seluruh suite Vitest sekali (`vitest run`) |
| `npm run build` | Membuat build produksi di `dist/` |
| `npm run preview` | Menyajikan hasil build produksi secara lokal |

---

## Menjalankan Unit Test (`npm test`)

```bash
npm test
```

Perintah ini menjalankan Vitest sekali (`vitest run`). Repositori saat ini memiliki **18 file test dan 108 test yang lulus**:

- `src/api/security.test.js` — validasi respons API, encoding URL, respons rusak, dan normalisasi error.
- `src/core/storage.test.js` — validasi lokasi, parsing preferensi, payload localStorage rusak/terlalu besar, deduplikasi, dan batas 20 lokasi.
- `src/utils/airChartGeometry.test.js` — geometri grafik AQI/PM2.5, batang kategori, penanda jendela terbaik, dan nilai kosong.
- `src/utils/airRanking.test.js` — peringkat udara terbersih/terburuk dan penanganan AQI tidak valid.
- `src/utils/alerts.test.js` — ambang peringatan cuaca dan batas jumlah peringatan.
- `src/utils/bestAirWindow.test.js` — pemilihan jendela tiga jam dengan rata-rata terendah.
- `src/utils/chartGeometry.test.js` — path grafik suhu, konversi satuan, batas plot, dan bar hujan.
- `src/utils/compass.test.js` — arah mata angin, normalisasi derajat, dan arah pergerakan asap.
- `src/utils/exposure.test.js` — perhitungan PM2.5 menjadi estimasi setara rokok.
- `src/utils/geolocation.test.js` — alur sukses dan error Geolocation API browser.
- `src/utils/healthAdvisory.test.js` — panduan masker, aktivitas, dan kelompok sensitif berdasarkan tingkat AQI.
- `src/utils/locationFilters.test.js` — pencarian, filter scope, pengurutan, nilai null, dan derivasi opsi filter.
- `src/utils/locationName.test.js` — nama tampilan lokasi perangkat yang terlokalisasi.
- `src/utils/pollutants.test.js` — ambang WHO, konversi CO/visibilitas, tingkat status, dan pembatasan persentase.
- `src/utils/sun.test.js` — progres matahari, deteksi siang/malam, dan format panjang hari.
- `src/utils/weatherShare.test.js` — validasi data berbagi, penyusunan pesan, dan encoding URL.
- `src/utils/weatherTheme.test.js` — pemetaan WMO ke tema hero dan penentuan siang/malam.
- `src/app.smoke.test.js` — merender seluruh aplikasi di DOM virtual linkedom menggunakan respons API tiruan; mencakup hero cuaca dan kabut asap, panel polutan, grafik tren, chip preset, empty state leaderboard, pergantian bahasa, pergantian satuan, dan preferensi tersimpan.

Smoke test bukan pengujian visual browser dan tidak membuktikan kebenaran tata letak. Saat ini belum ada script laporan coverage, suite browser end-to-end, atau pengujian regresi visual.

Untuk menjalankan Vitest dalam mode watch, gunakan `npx vitest` secara langsung.

---

## Build Produksi (`npm run build`)

```bash
npm run build
```

Build menghasilkan situs statis di `dist/`:

- `dist/index.html`
- satu bundle CSS ber-hash di `dist/assets/`
- satu bundle JavaScript ber-hash di `dist/assets/`
- file font WOFF2 self-host di `dist/assets/fonts/`

Build yang terverifikasi saat ini berhasil dengan Vite 8.3.8. Nama aset hasil build memuat hash konten, sehingga dapat di-cache dalam waktu lama.

Untuk menyajikan dan memeriksa hasil build produksi secara lokal:

```bash
npm run preview
```

`dist/` diabaikan oleh Git dan harus dibuat ulang sebagai bagian dari setiap deployment.

---

## Panduan Deployment

ATMOS adalah aplikasi satu halaman statis. Layanan hosting statis apa pun dapat menyajikan isi `dist/`; tidak diperlukan application server, database, API key, atau environment variable.

### Langkah yang disarankan

1. Pasang dependency dengan `npm ci`.
2. Jalankan pemeriksaan kualitas:

   ```bash
   npm test
   npm run build
   ```

3. Unggah **isi** direktori `dist/` sebagai root situs. Jangan mengunggah `src/`, `node_modules/`, atau file khusus pengembangan.
4. Konfigurasikan host agar menyajikan `index.html` untuk path root.

### Kebutuhan base path

`index.html` hasil build merujuk aset dari path root absolut seperti `/assets/index-*.js` dan `/assets/fonts/...`. Ini berfungsi saat situs dideploy di root domain (misalnya `https://example.com/`).

Untuk deployment di subpath—seperti GitHub Pages project site di `https://example.com/<repository>/`—atur opsi `base` Vite ke subpath tersebut sebelum build. Karena repositori ini tidak menyertakan `vite.config.js`, opsi paling sederhana adalah flag Vite melalui script npm:

```bash
npm run build -- --base=/<repository>/
```

Ganti `<repository>` dengan path repositori yang sebenarnya.

### Catatan hosting

- Tidak ada router sisi klien, sehingga tidak diperlukan aturan rewrite/fallback SPA untuk rute. Host tetap boleh mengarahkan path yang tidak dikenal ke `index.html` bila diinginkan.
- Aplikasi dapat dihosting di penyedia statis mana pun, termasuk Netlify, Vercel, Cloudflare Pages, GitHub Pages, atau web server konvensional. Integrasi tersebut tidak dikonfigurasi sebelumnya di repositori ini.
- Tidak ada konfigurasi hosting, header keamanan, aturan CDN, atau workflow CI yang disertakan. Konfigurasikan HTTPS, header content-security, dan caching di penyedia hosting bila diperlukan.
- Kebijakan cache yang wajar adalah cache jangka panjang untuk file ber-hash di `dist/assets/`, sedangkan `index.html` divalidasi ulang pada setiap deployment.
- Pertahankan atribusi Open-Meteo di footer agar tetap terlihat. Saat ini tidak ada aset OpenStreetMap yang menjadi bagian aplikasi.

---

## API & Atribusi Data (Open-Meteo & OpenStreetMap)

### Endpoint Open-Meteo yang digunakan

| Tujuan | Endpoint | Catatan |
|---|---|---|
| Prakiraan cuaca | `https://api.open-meteo.com/v1/forecast` | Kondisi saat ini, prakiraan per jam, dan prakiraan harian tujuh hari |
| Geocoding kota | `https://geocoding-api.open-meteo.com/v1/search` | Maksimal 8 hasil; bahasa mengikuti locale UI aktif (`id` atau `en`) |
| Kualitas udara | `https://air-quality-api.open-meteo.com/v1/air-quality` | US AQI, PM2.5, PM10, CO, NO2, O3 saat ini, serta AQI/PM2.5 per jam untuk tren |

Permintaan menggunakan:

- `timezone=auto` agar timestamp mengikuti zona waktu lokasi terpilih.
- Celsius dan km/jam untuk nilai prakiraan.
- `forecast_days=7` untuk prakiraan cuaca dan `forecast_days=2` untuk kualitas udara (agar tren 24 jam mencakup pergantian tengah malam).
- Tanpa API key, bearer token, SDK, atau proxy.

### Perilaku penanganan data

- Permintaan API memiliki timeout **10 detik** dan memakai `AbortController`.
- Respons prakiraan di-cache di memori selama **10 menit**; kualitas udara **15 menit**; pencarian geocoding **10 menit**.
- Permintaan yang sedang berjalan untuk koordinat sama (dibulatkan) digabung agar tidak terjadi panggilan ganda.
- Pemuatan forecast dan kualitas udara berjalan independen, sehingga satu sumber dapat gagal tanpa menghapus sumber lainnya.
- Respons hanya disimpan di memori; tidak ditulis ke `localStorage`.
- Field numerik yang hilang atau tidak valid ditampilkan sebagai “—”, bukan diganti nol.

### Atribusi di aplikasi

Footer menampilkan **“Data cuaca: Open-Meteo (CC BY 4.0)”** dalam Bahasa Indonesia dan **“Weather data: Open-Meteo (CC BY 4.0)”** dalam Bahasa Inggris, dengan tautan ke [open-meteo.com](https://open-meteo.com/) dan [lisensi CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Data kualitas udara dan geocoding berasal dari penyedia yang sama.

### Status OpenStreetMap

**OpenStreetMap saat ini tidak digunakan oleh ATMOS.** Repositori tidak memiliki komponen peta, dependency Leaflet, permintaan tile, marker peta, atau atribusi OpenStreetMap. Aplikasi tidak menampilkan peta.

Jika peta atau layer turunan OSM ditambahkan di masa depan, proyek wajib menampilkan “© OpenStreetMap contributors” dan menautkan ke [halaman copyright OpenStreetMap](https://www.openstreetmap.org/copyright), selain mematuhi ketentuan atribusi dan penggunaan dari penyedia tile.

---

## Struktur Proyek

```text
atmos/
├─ index.html                  # Entry point HTML satu halaman
├─ public/
│  └─ assets/fonts/            # Font WOFF2 Space Grotesk dan Inter self-host
├─ src/
│  ├─ main.js                  # Bootstrap aplikasi dan wiring store
│  ├─ ui.js                    # Header, status strip, ticker, footer, toast
│  ├─ style.css                # Token desain, komponen, grid, CSS responsif
│  ├─ api/                     # HTTP client dan pemetaan respons Open-Meteo
│  ├─ components/              # View cuaca, AQI, kabut asap, lokasi, pencarian, SVG
│  ├─ config/                  # Endpoint API, batas, TTL cache, template berbagi
│  ├─ core/                    # Store dan helper localStorage yang aman
│  ├─ i18n/                    # Kamus Indonesia/Inggris dan t()
│  ├─ services/                # Orkestrasi forecast/AQI, cache, deduplikasi request
│  └─ utils/                   # Perhitungan murni, format, filter, peringatan, geometri SVG
├─ package.json
├─ package-lock.json
├─ README.md                   # Dokumentasi Bahasa Inggris
└─ README.id.md                # Dokumentasi Bahasa Indonesia (file ini)
```

Tidak ada backend, serverless function, database, service worker, atau direktori fixture test di repositori ini.

---

## Keterbatasan yang Diketahui

### Penyimpanan hanya di browser lokal

Preferensi dan lokasi tersimpan **hanya memakai `localStorage` di browser dan origin saat ini**. Tidak ada backend, sistem akun, autentikasi, atau sinkronisasi antarperangkat.

| Key | Isi | Perilaku |
|---|---|---|
| `atmos.v1.preferences` | `{ unit: "c" \| "f", locale: "id" \| "en", updatedAt }` | Satuan/locale tidak valid kembali ke Celsius/Indonesia |
| `atmos.v1.locations` | Lokasi tersimpan dan status favorit | Maksimal 20 entri; ID duplikat dibuang; entri tidak valid dilewati |
| `atmos.v1.lastLocation` | Lokasi terakhir yang dipilih | Dipulihkan pada kunjungan berikutnya; data tidak valid dibuang |

Konsekuensi penting:

- Lokasi tersimpan, favorit, lokasi terakhir, satuan, dan bahasa **tidak tersinkronisasi** antar-browser, perangkat, profil, origin, atau jendela privat.
- Membersihkan data situs akan menghapus seluruh preferensi dan lokasi yang tersimpan secara lokal.
- Tidak ada login atau akun pengguna, sehingga siapa pun yang memakai profil browser yang sama dapat melihat lokasi tersimpan.
- Jika localStorage tidak tersedia, diblokir, atau penuh, penulisan gagal dengan aman dan aplikasi tetap berjalan menggunakan default; preferensi mungkin tidak bertahan setelah reload.
- JSON tersimpan dibatasi hingga 256 KB. Nilai rusak atau terlalu besar dihapus, bukan dipercaya.
- Memilih “Lokasi saya” membulatkan koordinat ke empat desimal dan menyimpannya seperti lokasi lain. Koordinat dikirim langsung ke Open-Meteo untuk permintaan prakiraan dan kualitas udara; tidak ada layanan reverse geocoding yang dipanggil.

### Keterbatasan data dan fungsi

- Aplikasi memerlukan koneksi internet dan bergantung pada ketersediaan serta batas laju Open-Meteo.
- Nilai AQI atau polutan dapat tidak tersedia untuk suatu lokasi. UI menampilkan status tidak tersedia/“—” daripada mengarang nilai.
- Ambang polutan adalah ambang referensi WHO tetap, bukan indeks regulasi yang diperbarui secara langsung. Estimasi setara rokok, saran masker, panduan aktivitas, dan peringatan kelompok sensitif bersifat informatif dan bukan nasihat medis.
- AQI memakai skala **US AQI**, bukan European AQI.
- Tren kualitas udara mencakup hingga 24 nilai per jam yang dikembalikan API. Aplikasi tidak menyimpan atau mengambil arsip kualitas udara historis.
- “Jam udara terbaik” hanyalah rata-rata AQI terendah dari tiga jam berurutan yang tersedia; ini bukan jaminan prakiraan.
- Aplikasi tidak menyediakan peta, hotspot kebakaran, citra satelit, pemodelan sebaran asap, atau data OpenStreetMap.
- Tidak ada notifikasi push, peringatan email, riwayat cuaca, animasi radar, atau data kelautan/polen.
- Berbagi WhatsApp memerlukan nama lokasi, suhu, kondisi cuaca, dan AQI. Kontrol berbagi dinonaktifkan sampai nilai-nilai tersebut tersedia.
- UI hanya mendukung Bahasa Indonesia dan Bahasa Inggris.
- Jika tidak ada lokasi terakhir yang valid, ATMOS dimulai dengan lokasi contoh **Kuta Selatan, Bali**, yang diberi label sebagai lokasi contoh.

### Keterbatasan runtime dan pengujian

- Tidak ada mode offline, service worker, atau PWA yang dapat diinstal.
- Tidak ada suite pengujian browser end-to-end atau tata letak visual. Smoke test berjalan di linkedom dan memverifikasi perilaku DOM yang dirender, bukan tata letak piksel atau kompatibilitas browser nyata.
- Aplikasi menargetkan browser modern dan tidak menyertakan polyfill.
