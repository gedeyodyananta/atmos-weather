# SPEC — ATMOS Weather Explorer

**Versi:** 1.3 (pemantau kabut asap)
**Peran:** System Analyst & Software Engineer
**Status:** Spesifikasi siap implementasi. Dokumen ini tidak berisi kode aplikasi.
**Sumber data:** Open-Meteo (forecast, geocoding, air quality), tanpa API key.
**Riwayat:** v1.3 — hero kabut asap, polutan karhutla, tren AQI 24 jam, arah pergerakan asap, preset & leaderboard kota; v1.2 — i18n ID/EN, bento dashboard, panel atmosfer/angin/matahari, grafik SVG, ticker, geolokasi; v1.1 — menambahkan fitur Air Quality Index (F13); v1.0 — spesifikasi awal MVP.

---

## 1. Project Overview dan Tujuan

ATMOS — Weather Explorer adalah aplikasi web statis (tanpa backend) untuk memantau kondisi cuaca, melihat prakiraan, dan mengeksplorasi informasi atmosfer di berbagai lokasi. Aplikasi mengutamakan kejelasan informasi dengan bahasa visual **Neo-Brutalist + Playful**: tipografi tebal, border hitam tebal, hard offset shadow, blok warna modular, dan ilustrasi cuaca 3D lokal.

**Tujuan:**
1. Menyajikan kondisi cuaca saat ini, prakiraan per jam, dan prakiraan 7 hari dari satu lokasi terpilih.
2. Membuat data meteorologi dasar (kelembapan, angin, UV, tekanan, visibilitas) mudah dipindai dan dipahami pengguna awam.
3. Menyimpan preferensi (satuan suhu) dan lokasi favorit secara lokal sehingga pengguna tidak mengulang pencarian.
4. Menjaga kejujuran data: tidak ada data statis yang dipresentasikan sebagai cuaca nyata.
5. Memberi konteks kualitas udara (AQI, PM2.5, PM10) pada lokasi terpilih sebagai indikator tambahan untuk aktivitas luar ruang.
6. Menyajikan status kabut asap/karhutla yang mudah dipindai: rekomendasi masker, izin aktivitas, polutan utama, tren 24 jam, arah pergerakan asap, dan perbandingan udara antar kota rawan.

**Prinsip produk:**
- **Satu pertanyaan utama per layar:** "Bagaimana cuaca di sini sekarang?"
- **Ekspresif, bukan dekoratif berlebihan:** warna dan bentuk mendukung hierarki informasi, bukan mengaburkannya.
- **Transparan saat gagal:** setiap kegagalan API memiliki pesan yang jelas dan aksi lanjutan.
- **Tanpa akun:** semua data pengguna bersifat lokal di perangkat.

**Non-goals (ringkas):** backend, database, autentikasi, notifikasi, prediksi buatan sendiri.

### 1.1 Revisi implementasi v1.2

Implementasi memperluas cakupan MVP tanpa mengubah prinsip data jujur dan tanpa backend:

- **Bahasa UI ID/EN** — locale disimpan bersama satuan di `atmos.v1.preferences`; default `id`. Semua teks (termasuk pesan error, kategori AQI/UV, tanggal, dan pesan WhatsApp) berasal dari kamus `src/i18n/`. Geocoding memakai `language` sesuai locale.
- **Grafik tren 24 jam** — SVG native tanpa Chart.js/dependency; geometri murni di `src/utils/chartGeometry.js` dan diuji Vitest. Ini menggantikan rencana Chart.js (F8) dan disetujui saat audit.
- **Dashboard bento** — hero + panel AQI + strip per jam + 7 hari + grafik + 6 tile atmosfer + kompas angin + busur matahari. Desktop memakai rail lokasi; mobile satu kolom.
- **Tema hero `data-tone`** — sembilan tone (clear/cloud day-night, rain, storm, snow, fog, unknown) dipetakan dari kode WMO + `is_day`; warna dipusatkan di CSS, bukan inline style.
- **Ticker & status strip** — peringatan hanya diturunkan dari data nyata (`utils/alerts.js`): hujan ≥60% dalam 6 jam, badai (kode ≥95), UV ≥8, angin ≥35 km/j atau hembusan ≥50 km/j, AQI ≥101, selisih suhu ≥12°. Tanpa peringatan, ticker menampilkan ringkasan kondisi.
- **Geolokasi perangkat** — tombol "Lokasi saya" memakai Geolocation API, koordinat dibulatkan 4 desimal, tanpa reverse geocoding. Koordinat hanya disimpan bila pengguna memilihnya (perilaku sama dengan lokasi lain).
- **Font self-host** — Space Grotesk & Inter subset latin di `public/assets/fonts/`; tidak ada CDN atau dependency produksi.
- **Aksesibilitas** — target sentuh ≥44 px untuk kontrol utama, fokus visible, `aria-pressed` pada toggle, `aria-live` pada status/ticker, dan `prefers-reduced-motion` menonaktifkan animasi ticker/glyph.

### 1.2 Revisi implementasi v1.3 — pemantau kabut asap

Perluasan berfokus pada karhutla/kabut asap tanpa menambah backend, akun, atau dependency produksi:

- **Hero kabut asap** — latar berubah mengikuti kategori AQI (hijau, kuning, oranye, merah, ungu pekat); menampilkan status masker, izin aktivitas luar, peringatan kelompok sensitif, dan estimasi paparan setara rokok dari PM2.5.
- **Bento polutan** — PM2.5, PM10, CO, NO2, O3, dan jarak pandang dengan progress bar terhadap ambang WHO. CO dikonversi dari µg/m³ ke mg/m³; visibilitas memakai referensi 10 km dan arah penilaian “semakin tinggi semakin baik”.
- **Tren udara 24 jam** — batang AQI per kategori + garis PM2.5 dengan skala kanan terpisah; badge “Jam Udara Terbaik” memakai rata-rata AQI terendah dari jendela 3 jam berurutan.
- **Radar angin diperkaya** — derajat, mata angin 8 arah terlokalisasi (mis. “Tenggara”), kecepatan/hembusan, dan arah pergerakan asap (`degrees + 180`, downwind).
- **Preset & leaderboard** — empat kota rawan karhutla (Palangkaraya, Pontianak, Pekanbaru, Jambi) dapat ditambahkan dengan satu klik; peringkat udara terbersih/terburuk dihitung dari lokasi tersimpan yang memiliki AQI numerik.
- **Utilitas murni** — seluruh kalkulasi baru berada di `src/utils/` (`exposure`, `healthAdvisory`, `bestAirWindow`, `compass`, `airRanking`, `pollutants`, `airChartGeometry`) dan diuji Vitest; komponen hanya mengurus DOM.

---

## 2. Target Pengguna dan User Needs

### 2.1 Persona utama
**Pengguna umum harian** — bukan meteorolog. Ingin tahu apakah perlu membawa payung, jaket, atau tabir surya, dan ingin membandingkan cuaca beberapa kota (kota domisili, kota keluarga, kota tujuan perjalanan). Mengakses lewat ponsel dan desktop, koneksi bervariasi.

### 2.2 User needs → fitur

| Kebutuhan pengguna | Fitur penjawab |
|---|---|
| "Sekarang cuacanya bagaimana di kotaku?" | Dashboard cuaca saat ini + feels-like |
| "Apakah nanti sore hujan?" | Prakiraan per jam (24 jam ke depan) |
| "Bagaimana seminggu ke depan?" | Prakiraan 7 hari |
| "Apakah UV hari ini berbahaya? Anginnya kencang?" | Panel informasi atmosfer |
| "Apakah udara di sini sehat untuk beraktivitas di luar?" | Hero kabut asap + panel AQI: masker, izin aktivitas, kelompok sensitif |
| "Seberapa parah polutan dan asapnya?" | Bento PM2.5/PM10/CO/NO2/O3 + visibilitas terhadap ambang WHO |
| "Kapan udara paling bersih hari ini?" | Tren AQI 24 jam + badge jam udara terbaik |
| "Ke mana asap bergerak?" | Radar angin + arah downwind |
| "Kota mana yang udaranya paling buruk?" | Preset kota karhutla + leaderboard udara |
| "Bagaimana cuaca di kota lain?" | Pencarian lokasi + favorit |
| "Aku terbiasa Fahrenheit." | Toggle satuan suhu |
| "Aku ingin lihat tren suhu, bukan angka saja." | Grafik perubahan suhu |
| "Aku ingin tahu posisi lokasi ini." | Weather map preview (sekunder) |
| "Aku tidak mau mengatur ulang tiap buka aplikasi." | LocalStorage preferensi & favorit |

### 2.3 Konteks penggunaan
- **Mobile (360–480 px):** satu kolom, akses cepat ke suhu dan kondisi.
- **Tablet (481–1024 px):** dua kolom asimetris.
- **Desktop (≥1025 px):** grid editorial asimetris, panel samping untuk favorit/pencarian.
- Sesi singkat (30–90 detik), berulang beberapa kali sehari.

---

## 3. Fitur MVP

Prioritas: **P0** = wajib, inti aplikasi, tidak boleh dipotong. **P1** = penting, dipotong hanya jika waktu habis. **P2** = sekunder, boleh tidak selesai dan harus ditandai demikian di UI/README.

| # | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| F1 | Weather dashboard | Menampilkan nama lokasi, negara, tanggal lokal, suhu saat ini, kondisi cuaca (label + ikon), feels-like. Blok hero besar sebagai fokus visual. | P0 |
| F2 | Katalog prakiraan per jam | Strip horizontal 24 jam ke depan: jam, ikon, suhu, probabilitas hujan, kecepatan angin. Scroll horizontal di mobile. | P0 |
| F3 | Prakiraan 7 hari | Daftar 7 kartu/baris: hari & tanggal, ikon, suhu maks/min, probabilitas hujan. Hari ini ditandai. | P0 |
| F4 | Informasi atmosfer | 5 metrik: kelembapan (%), angin (kecepatan km/j + arah derajat/mata angin), UV index (+ kategori), tekanan (hPa), visibilitas (km). AQI ditampilkan pada panel terpisah (F13). | P0 |
| F5 | Pencarian lokasi | Input nama kota → hasil geocoding (nama, wilayah administratif, negara) → pilih untuk mengganti lokasi aktif. Debounce, minimal 2 karakter, maksimal 8 hasil. | P0 |
| F6 | Favorit lokasi | Tambah/hapus lokasi aktif dari favorit; daftar favorit dapat diklik untuk berpindah lokasi; kosong = empty state dengan ajakan mencari kota. | P0 |
| F7 | Toggle satuan suhu | Celsius ⇄ Fahrenheit untuk **semua** tampilan suhu (dashboard, hourly, daily, grafik). Angin tetap km/j, visibilitas km, tekanan hPa. | P0 |
| F8 | Grafik suhu | Line chart 24 jam (suhu + feels-like) memakai Chart.js; sumbu mengikuti satuan aktif; tooltip menampilkan jam lokal. | P1 |
| F9 | Ilustrasi cuaca | Aset 3D lokal (`/public/assets/weather/*.webp`) dipetakan dari WMO weather code; fallback placeholder lokal (SVG) bila aset tidak ada/gagal dimuat. | P0 (fallback) / P1 (aset 3D penuh) |
| F10 | Weather map preview | Peta Leaflet + tile OpenStreetMap, marker lokasi aktif, zoom control, dan satu kontrol layer sederhana. **Hanya jika** sumber layer tersedia dan stabil; jika tidak, panel menampilkan keterangan "Peta tidak tersedia" tanpa layer palsu. | P2 |
| F11 | LocalStorage | Menyimpan preferensi satuan, daftar favorit, dan lokasi terakhir. Data korup/versi lama diabaikan dengan aman (reset + lanjut). | P0 |
| F12 | Loading / error / empty state | State eksplisit untuk setiap wilayah data: skeleton/spinner saat memuat, panel error dengan tombol "Coba lagi", empty state untuk pencarian tanpa hasil dan favorit kosong. | P0 |
| F13 | Air Quality Index (AQI) | Panel kualitas udara: nilai **US AQI** (0–500), kategori (Good/Moderate/Unhealthy for Sensitive Groups/Unhealthy/Very Unhealthy/Hazardous) dengan label Indonesia, indikator visual berupa meter posisi + warna/pola per kategori. Rincian PM ada di F15. Data dari Open-Meteo Air Quality API. | P1 (fitur tambahan; versi minimal wajib) |
| F14 | Hero status kabut asap | Kartu hero dengan latar dinamis per kategori AQI; status masker (Tanpa Masker/Masker Medis/Wajib N95/KF94), izin aktivitas luar, peringatan kelompok sensitif, dan estimasi paparan setara rokok (PM2.5 ÷ 22, 1 desimal). | P0 |
| F15 | Bento polutan & visibilitas | Enam kartu: PM2.5 (ambang 15), PM10 (45), CO (4 mg/m³), NO2 (25), O3 (100 µg/m³), dan jarak pandang (referensi 10 km) dengan progress bar + status aman/mendekati/melebihi ambang WHO. | P0 |
| F16 | Tren AQI 24 jam | Grafik SVG batang AQI berwarna per kategori + garis PM2.5 skala kanan, sumbu jam lokal, penanda puncak, serta badge jendela 3 jam dengan rata-rata AQI terendah. | P0 |
| F17 | Radar angin & asap | Arah derajat + mata angin terlokalisasi, kecepatan/hembusan, dan arah pergerakan asap berlawanan arah datangnya angin. | P0 |
| F18 | Preset & leaderboard karhutla | Chip cepat Palangkaraya, Pontianak, Pekanbaru, Jambi; peringkat udara terbersih vs terburuk dari lokasi tersimpan yang memiliki AQI. | P1 |

### 3.1 Aturan perilaku penting
- **Sumber kebenaran suhu:** semua permintaan API memakai Celsius; konversi F dilakukan di lapisan format tampilan. Tidak ada permintaan ulang ke API hanya karena satuan berubah.
- **Lokasi awal:** lokasi terakhir (dari LocalStorage) → jika tidak ada, lokasi contoh bawaan (Jakarta) dengan label kecil **"Lokasi contoh"**; tidak ada permintaan izin geolokasi perangkat di MVP.
- **Zona waktu:** semua waktu ditampilkan dalam zona waktu lokasi terpilih (dari `timezone` Open-Meteo), bukan zona waktu perangkat.
- **Pembaruan data:** tidak ada polling otomatis. Data di-cache 10 menit; tombol "Perbarui" manual tersedia di dashboard.
- **Atribusi:** footer memuat "Data cuaca: Open-Meteo (CC BY 4.0)" dan peta memuat atribusi OpenStreetMap.
- **Demo:** tidak ada data statis sebagai pengganti API. Jika mode demo dipakai untuk pengembangan/offline, seluruh blok data wajib berlabel **"DEMO — bukan data cuaca nyata"** dan tidak boleh aktif secara default.

### 3.2 Aturan fitur AQI (F13)
- **Skala:** gunakan **US AQI** (`us_aqi`) dan selalu tampilkan label "US AQI" agar tidak tertukar dengan European AQI.
- **Sumber terpisah:** AQI diambil dari endpoint air quality, bukan forecast. Permintaan dijalankan paralel dan kegagalan salah satu tidak menggagalkan panel lainnya.
- **Kategori dihitung di klien** dari nilai `us_aqi` memakai satu fungsi ambang (`utils/aqi.js`), tidak bergantung pada label dari API.
- **PM2.5/PM10:** tampilkan angka bila bertipe number; bila `null`/tidak ada → "—" dengan keterangan "tidak tersedia". Jangan menampilkan 0 sebagai pengganti.
- **Tanpa klaim medis:** teks kategori bersifat informatif (mis. "Udara baik untuk aktivitas luar"), bukan diagnosis atau nasihat medis.
- **Cache:** TTL 15 menit, terpisah dari cache forecast (10 menit).
- **Kejujuran data:** jika endpoint AQI gagal, panel menampilkan error/empty state terisolasi; tidak boleh memakai angka contoh tanpa label DEMO.

**Ambang kategori (US AQI):**

| Kategori (label UI) | Rentang | Warna blok | Teks | Penanda tambahan |
|---|---|---|---|---|
| Good — Baik | 0–50 | Fresh Lime `#B8E986` | `--ink` | label "BAIK" |
| Moderate — Sedang | 51–100 | Solar Yellow `#F9E547` | `--ink` | label "SEDANG" |
| Unhealthy for Sensitive Groups — Tidak Sehat (Grup Sensitif) | 101–150 | Coral `#FF765E` | `--ink` | pola garis diagonal + label |
| Unhealthy — Tidak Sehat | 151–200 | Coral `#FF765E` | `--ink` | pola silang + label |
| Very Unhealthy — Sangat Tidak Sehat | 201–300 | Ink `#171717` | Cream `#F5F0E6` | label + ikon peringatan |
| Hazardous — Berbahaya | 301+ | Ink `#171717` | Solar Yellow `#F9E547` | label + pola |

Warna tidak boleh menjadi satu-satunya pembeda (aksesibilitas): label teks kategori dan pola selalu ditampilkan. Angka AQI dibulatkan ke bilangan bulat.

### 3.3 Aturan fitur kabut asap (F14–F18)
- **Warna hero** dipetakan dari kategori AQI: `good` hijau, `moderate` kuning, `sensitive` oranye, `unhealthy` merah, `very_unhealthy`/`hazardous` ungu pekat. Hero tetap menampilkan label teks; warna bukan satu-satunya pembeda.
- **Rekomendasi masker**: `good`/`moderate` → Tanpa Masker; `sensitive` → Masker Medis; `unhealthy` ke atas → Wajib N95/KF94. Rekomendasi aktivitas dan kelompok sensitif memakai tingkat AQI yang sama.
- **Setara rokok**: `PM2.5 ÷ 22`, dibulatkan satu desimal. Bila PM2.5 tidak valid → “—”. Teks wajib menyebut ini estimasi, bukan diagnosis medis.
- **Ambang WHO** dipusatkan di `src/utils/pollutants.js`: PM2.5 15 µg/m³, PM10 45 µg/m³, CO 4 mg/m³ (API µg/m³, skala 0.001), NO2 25 µg/m³, O3 100 µg/m³. Status: ≤50% aman, ≤100% mendekati ambang, >100% melebihi. Visibilitas memakai referensi 10 km dan status terbalik (semakin tinggi semakin baik); nilai API dalam meter, ditampilkan km.
- **Jam udara terbaik** dihitung dari rata-rata AQI terendah pada jendela 3 jam berurutan; jendela dengan AQI `null` dilewati. Badge menampilkan jam mulai–selesai format `HH.mm`.
- **Arah asap** = arah datangnya angin + 180° (downwind), dengan nama mata angin 8 arah terlokalisasi. Arah tidak tersedia bila derajat angin bukan angka.
- **Preset** memakai koordinat tetap empat kota rawan karhutla dan mengikuti alur tambah lokasi biasa (deduplikasi koordinat/id, batas 20 lokasi). **Leaderboard** hanya membandingkan lokasi dengan AQI numerik dan diurutkan dari AQI terendah; minimal dua lokasi agar tampil.
- **Fungsi murni & pengujian**: kalkulasi tidak boleh berada di komponen; setiap utilitas baru memiliki unit test Vitest.

---

## 4. Data Model dan Struktur Penyimpanan

### 4.1 Model domain (in-memory)

```text
Location
  id: string            // "geo:<geocoding.id>" atau "custom:<lat>,<lon>"
  name: string
  country: string       // nama negara
  admin1?: string       // provinsi/region, untuk disambiguasi
  latitude: number
  longitude: number
  timezone: string      // IANA, dari Open-Meteo; fallback "auto"

WeatherCurrent
  temperature: number          // °C
  apparentTemperature: number  // °C
  weatherCode: number          // WMO
  humidity: number             // %
  windSpeed: number            // km/j
  windDirection: number        // 0–360°
  uvIndex: number              // dari hourly pada jam berjalan
  pressure: number             // hPa (surface_pressure)
  visibility: number           // meter (hourly.visibility jam berjalan)
  sunrise: string              // ISO lokal "YYYY-MM-DDTHH:mm"
  sunset: string
  timestamp: string            // current.time (ISO lokal)

HourlyForecast
  time: string                 // ISO lokal
  temperature: number          // °C
  apparentTemperature: number  // °C
  precipitationProbability: number // %
  weatherCode: number
  windSpeed: number            // km/j

DailyForecast
  date: string                 // "YYYY-MM-DD"
  weatherCode: number
  temperatureMax: number       // °C
  temperatureMin: number       // °C
  precipitationProbability: number // %
  sunrise: string
  sunset: string
  uvIndexMax: number

AirQualityCurrent
  aqi: number                  // US AQI, 0–500+, dibulatkan di tampilan
  category: string             // good | moderate | sensitive | unhealthy | very_unhealthy | hazardous
  pm25: number | null          // µg/m³ (pm2_5)
  pm10: number | null          // µg/m³
  co: number | null            // µg/m³ (carbon_monoxide); UI menampilkan mg/m³
  no2: number | null           // µg/m³ (nitrogen_dioxide)
  o3: number | null            // µg/m³ (ozone)
  hourly: AirQualityHour[]     // maksimal 24 jam mulai jam berjalan
  dominantPollutant?: string   // "pm2_5" | "pm10" | ... (opsional, P1)
  timestamp: string            // current.time (ISO lokal)
  scale: "us"                  // selalu "us"

AirQualityHour
  time: string                 // ISO lokal
  aqi: number | null           // us_aqi per jam
  pm25: number | null          // pm2_5 per jam

FavoriteLocation
  id: string
  name: string
  country: string
  latitude: number
  longitude: number
```

### 4.2 Pemetaan API → model

**Geocoding:** `GET https://geocoding-api.open-meteo.com/v1/search?name={q}&count=8&language=id&format=json`
→ `results[]` (`id`, `name`, `country`, `admin1`, `latitude`, `longitude`, `timezone`). Respons tanpa `results` = hasil kosong, bukan error.

**Forecast:** `GET https://api.open-meteo.com/v1/forecast`
Parameter: `latitude`, `longitude`, `timezone=auto`, `forecast_days=7`,
`current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure`,
`hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,uv_index,visibility`,
`daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max`,
`wind_speed_unit=kmh`, `temperature_unit=celsius`.

| Field model | Sumber API |
|---|---|
| `current.temperature` | `current.temperature_2m` |
| `current.apparentTemperature` | `current.apparent_temperature` |
| `current.weatherCode` | `current.weather_code` |
| `current.humidity` | `current.relative_humidity_2m` |
| `current.windSpeed` / `windDirection` | `current.wind_speed_10m` / `current.wind_direction_10m` |
| `current.pressure` | `current.surface_pressure` |
| `current.uvIndex` | `hourly.uv_index` pada indeks jam = `current.time` |
| `current.visibility` | `hourly.visibility` pada indeks jam = `current.time` |
| `current.sunrise` / `sunset` | `daily.sunrise[0]` / `daily.sunset[0]` |
| `hourly[]` | 24 entri mulai dari jam berjalan, dari array `hourly.*` |
| `daily[]` | 7 entri dari array `daily.*`, `precipitationProbability ← precipitation_probability_max`, `uvIndexMax ← uv_index_max` |

Catatan teknis: UV index dan visibility **tidak** tersedia di blok `current`, sehingga wajib diturunkan dari array `hourly`. Jika indeks jam berjalan tidak ditemukan, nilai ditampilkan sebagai "—" (bukan 0).

**Air Quality:** `GET https://air-quality-api.open-meteo.com/v1/air-quality`
Parameter: `latitude`, `longitude`, `timezone=auto`, `domains=auto`, `forecast_days=2`,
`current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,ozone`,
`hourly=us_aqi,pm2_5`.

| Field model | Sumber API |
|---|---|
| `airQuality.aqi` | `current.us_aqi` |
| `airQuality.pm25` | `current.pm2_5` |
| `airQuality.pm10` | `current.pm10` |
| `airQuality.co` | `current.carbon_monoxide` |
| `airQuality.no2` | `current.nitrogen_dioxide` |
| `airQuality.o3` | `current.ozone` |
| `airQuality.hourly[]` | `hourly.us_aqi` + `hourly.pm2_5`, maksimal 24 entri mulai indeks jam `current.time` |
| `airQuality.timestamp` | `current.time` |
| `airQuality.category` | dihitung klien dari `aqi` (lihat §3.2) |
| `airQuality.dominantPollutant` | sub-indeks `us_aqi_*` tertinggi pada jam berjalan (opsional) |

Catatan teknis: `us_aqi` dapat bernilai `null` untuk koordinat tertentu. `null` bukan 0 — perlakuannya status `unavailable`, dan panel menampilkan "Data kualitas udara tidak tersedia untuk lokasi ini". `forecast_days=2` memberi ruang 24 jam tren melewati tengah malam; bila indeks jam berjalan tidak ditemukan, pemetaan mulai dari indeks 0.

### 4.3 LocalStorage

| Key | Isi | Catatan |
|---|---|---|
| `atmos.v1.preferences` | `{ unit: "c" \| "f", updatedAt: ISO }` | Default `c` bila tidak ada/rusak |
| `atmos.v1.favorites` | `FavoriteLocation[]` (maks. 20) | Deduplikasi berdasarkan `id`; urutan = urutan tambah |
| `atmos.v1.lastLocation` | `Location` | Dipakai saat boot |

Aturan:
- Semua akses dibungkus helper `safeRead`/`safeWrite` dengan `try/catch` (kuota penuh, mode privat, JSON korup).
- Validasi bentuk data sebelum dipakai; data tidak valid → hapus key terkait, pakai default, tanpa crash.
- Key diberi prefiks versi (`v1`) agar migrasi mudah; perubahan skema wajib menaikkan versi.
- Tidak ada data pribadi yang disimpan (tanpa nama pengguna, tanpa koordinat perangkat dari GPS).

### 4.4 Cache runtime
- Cache in-memory (`Map`), kunci `round(lat,3),round(lon,3)`, TTL 10 menit, agar berpindah favorit tidak memicu permintaan berulang.
- Cache pencarian geocoding: kunci `query.toLowerCase()` + bahasa, TTL 10 menit.
- Cache AQI: kunci `aqi:round(lat,3),round(lon,3)`, TTL 15 menit (terpisah dari cache forecast).
- Tidak ada penyimpanan respons API ke LocalStorage (menghindari data basi dan kuota).

---

## 5. Tech Stack dan Arsitektur Frontend

### 5.1 Stack
| Lapisan | Teknologi | Keterangan |
|---|---|---|
| Build/dev | Vite | Dev server + build statis |
| Bahasa | Vanilla JS (ES Modules) | Tanpa framework |
| Markup/styling | HTML5 + CSS3 (custom properties) | Tanpa UI kit |
| Data | Open-Meteo forecast, geocoding & air quality | Tanpa API key |
| Grafik | Chart.js (line chart) | Di-load sebagai modul proyek |
| Peta | Leaflet + tile OpenStreetMap | P2, dimuat dinamis hanya saat panel peta terlihat |
| Persistensi | LocalStorage | Preferensi + favorit + lokasi terakhir |
| Font | Space Grotesk (heading/angka), Inter (body) | Self-host atau `@font-face` lokal; sediakan fallback sistem |

### 5.2 Struktur direktori

```text
atmos/
├─ index.html
├─ public/
│  ├─ assets/weather/            # ilustrasi 3D lokal (webp/png)
│  ├─ assets/placeholder.svg     # fallback ilustrasi
│  └─ assets/fonts/
└─ src/
   ├─ main.js                    # bootstrap: state awal, render, event global
   ├─ config/constants.js        # endpoint, TTL, batas, key storage, palette token
   ├─ core/
   │  ├─ store.js                # state + subscribe/notify
   │  ├─ storage.js              # safeRead/safeWrite + validasi
   │  └─ events.js               # delegasi event & binding komponen
   ├─ api/
   │  ├─ http.js                 # fetch + timeout + AbortController + normalisasi error
      │  ├─ geocoding.js             # searchLocations()
   │  ├─ forecast.js              # getForecast()
   │  └─ airQuality.js            # getAirQuality()
   ├─ services/
   │  └─ weatherService.js       # orkestrasi, cache, mapping API → model
   ├─ utils/
   │  ├─ format.js               # suhu, angka, waktu (Intl, timezone lokasi)
   │  ├─ wmo.js                  # kode WMO → label ID + nama aset + kategori
   │  ├─ aqi.js                  # ambang US AQI → kategori, label, warna, pola
   │  └─ dom.js                  # helper render (el, escape, cleared container)
   ├─ components/
   │  ├─ header.js               # brand, pencarian, toggle satuan
   │  ├─ dashboard.js            # F1 + ilustrasi
   │  ├─ hourly.js               # F2
   │  ├─ daily.js                # F3
   │  ├─ atmosphere.js           # F4
   │  ├─ aqi.js                  # F13 (panel kualitas udara)
   │  ├─ chart.js                # F8
   │  ├─ favorites.js            # F6
   │  ├─ map.js                  # F10 (lazy)
   │  └─ states.js               # F12 (skeleton, error, empty)
   └─ styles/
      ├─ tokens.css              # warna, spacing, border, shadow, tipografi
      ├─ base.css                # reset, tipografi, aksesibilitas fokus
      ├─ layout.css              # grid editorial asimetris + breakpoint
      └─ components.css          # kartu, tombol, badge, state
```

### 5.3 Alur data (unidirectional)

```text
User action (cari / pilih favorit / ganti satuan / retry)
        │
        ▼
events.js ──► store.dispatch(action)
        │
        ▼
store (state tunggal) ──► subscriber: render(component)
        │
        ├─ jika butuh data & cache kedaluwarsa:
        │     weatherService.load(location) ─► api/* ─► mapping ─► store.set({weather, status})
        └─ jika hanya preferensi: storage.write + render ulang (tanpa fetch)
```

**State tunggal (bentuk konseptual):**

```text
{
  location: Location | null,
  weather: { current, hourly[], daily[] } | null,
  status: "idle" | "loading" | "ready" | "error",
  error: { code, messageKey, retryable } | null,
  airQuality: AirQualityCurrent | null,
  airQualityStatus: "idle" | "loading" | "ready" | "error" | "unavailable",
  airQualityError: { code, messageKey, retryable } | null,
  preferences: { unit: "c" | "f" },
  favorites: FavoriteLocation[],
  search: { query, status, results[], error },
  ui: { mapEnabled: boolean, lastUpdated: ISO | null }
}
```

### 5.4 Aturan arsitektur
1. **Tidak ada DOM manipulation di lapisan api/service.** Service mengembalikan data atau melempar error terstruktur.
2. **Render idempoten per komponen:** setiap komponen mengekspor `render(container, slice)`; komponen hanya membaca state yang menjadi tanggung jawabnya.
3. **Satu tempat konversi satuan:** `utils/format.js`. Tidak ada `* 9/5 + 32` di komponen.
4. **Satu tempat pemetaan error:** `api/http.js` memetakan kegagalan ke `{ code, retryable }` dengan kode: `NETWORK`, `TIMEOUT`, `HTTP_4XX`, `HTTP_5XX`, `PARSE`, `EMPTY_DATA`.
5. **Lazy load** Chart.js dan Leaflet (dynamic `import()`) agar first paint ringan; kegagalan memuat library tidak boleh merusak dashboard (fallback ke tabel/placeholder + pesan).
6. **Event delegation** pada `#app`; tidak ada listener per item yang dibuat ulang setiap render.
7. **Tanpa dependensi tambahan** selain Chart.js dan Leaflet.
8. **Isolasi sumber data:** forecast dan AQI diminta bersamaan (`Promise.allSettled`) dengan slice state masing-masing; kegagalan salah satu tidak mengubah status panel lainnya.

### 5.5 Design system (kontrak visual)
| Token | Nilai | Pemakaian |
|---|---|---|
| `--solar` | `#F9E547` | Hero suhu, highlight |
| `--sky` | `#83B8FF` | Blok prakiraan, aksen |
| `--coral` | `#FF765E` | Peringatan/UV tinggi, tombol hapus |
| `--lime` | `#B8E986` | Status baik, metrik positif |
| `--cream` | `#F5F0E6` | Latar utama |
| `--ink` | `#171717` | Teks, border, shadow |
| Border | `2–3px solid var(--ink)` | Semua kartu/kontrol |
| Shadow | `4px 4px 0 var(--ink)` (kartu), `6px 6px 0` (hero) | Hard offset, tanpa blur |
| Radius | `0–6px` maksimum | Sudut tegas |
| Motion | `120–180ms` transform translasi kecil | Hover: `translate(-2px,-2px)`; pressed: `translate(2px,2px)` + shadow mengecil |
| Fokus | `3px solid var(--ink)` + offset `2px` | Wajib terlihat di semua kontrol |

Larangan tegas: glassmorphism/backdrop-blur, gradient dekoratif, kartu seragam (setiap blok punya proporsi/tipe visual berbeda), ikon stok generik tanpa gaya.

---

## 6. Non-Functional Requirements

| ID | Kategori | Requirement | Cara verifikasi |
|---|---|---|---|
| NFR-1 | Responsif | Berfungsi pada 360 px, 768 px, 1280 px tanpa scroll horizontal yang tidak disengaja | Uji manual (DevTools responsive) |
| NFR-2 | Performa | First content paint < 2,5 dtk pada koneksi 4G; payload awal (HTML+CSS+JS inti) < 250 KB sebelum chart/peta | Network tab, ukuran build |
| NFR-3 | Efisiensi data | 1 permintaan forecast per lokasi per 10 menit; pencarian di-debounce 350 ms; permintaan usang dibatalkan | Network tab saat mengetik cepat |
| NFR-4 | Modularitas | Tidak ada file komponen > 250 baris; tidak ada ketergantungan melingkar; mapping data terpusat di service | Review struktur `src/` |
| NFR-5 | Error handling | Semua `fetch` memiliki timeout 10 dtk dan penanganan error; `window.onerror`/`unhandledrejection` mencatat ke console + menampilkan toast netral, tidak menimpa UI | Uji offline & blokir request |
| NFR-6 | Aksesibilitas | Kontras teks ≥ 4.5:1 pada latar blok; navigasi keyboard penuh; `aria-live="polite"` untuk status muat/error; `alt` pada ilustrasi; `prefers-reduced-motion` menonaktifkan transisi | Uji keyboard + cek kontras |
| NFR-7 | Konsistensi format | Suhu 1 desimal (mis. `27.4°C`), angin 1 desimal, kelembapan/UV bulat, tekanan bulat, waktu `HH.mm` sesuai timezone lokasi, tanggal `Sen, 17 Nov` | Inspeksi visual lintas panel |
| NFR-8 | Persistensi | Preferensi, favorit, lokasi terakhir bertahan setelah reload dan setelah tab ditutup | Uji reload |
| NFR-9 | Ketahanan | LocalStorage rusak/penuh, aset ilustrasi hilang, Chart.js/Leaflet gagal dimuat → aplikasi tetap bisa dipakai | Simulasi manual |
| NFR-10 | Keterbacaan kode | Nama modul/fungsi deskriptif, tanpa `console.log` sisa, komentar hanya untuk keputusan non-obvious | Review kode |
| NFR-11 | Legal/atribusi | Atribusi Open-Meteo dan OpenStreetMap selalu tampil, tidak dihapus | Inspeksi UI |
| NFR-12 | Batas API | Tanpa API key; tanpa retry berlebihan (maks. 1 retry manual per aksi); tanpa request paralel ganda untuk lokasi sama | Network tab |
| NFR-13 | Isolasi kegagalan data | Kegagalan endpoint AQI tidak memengaruhi dashboard cuaca dan sebaliknya; panel yang gagal punya aksi retry sendiri | Blokir salah satu endpoint di DevTools, muat ulang |
| NFR-14 | Konsistensi kategori AQI | Kategori dihitung dari satu fungsi ambang; nilai batas 50/51, 100/101, 150/151, 200/201, 300/301 menghasilkan kategori yang benar | Uji nilai batas secara manual |

---

## 7. Risiko dan Mitigasi

| # | Risiko | Dampak | Kemungkinan | Mitigasi |
|---|---|---|---|---|
| R1 | API cuaca tidak dapat diakses / offline | Tinggi | Sedang | Timeout 10 dtk, error state dengan tombol "Coba lagi" + petunjuk periksa koneksi; data terakhir di memori tetap ditampilkan dengan label "Data terakhir: HH.mm" bila ada |
| R2 | Pencarian lokasi tidak ditemukan | Rendah | Sedang | Empty state "Kota tidak ditemukan", saran ejaan, tampilkan maks. 8 hasil; tidak dianggap error sistem |
| R3 | Data cuaca tidak tersedia untuk lokasi tertentu | Sedang | Rendah | Deteksi array kosong/`null` → status `EMPTY_DATA`, panel menampilkan "Data tidak tersedia untuk lokasi ini" + saran lokasi lain |
| R4 | Perbedaan timezone antarwilayah | Sedang | Tinggi | Selalu gunakan `timezone=auto` dan `timezone` dari respons; semua format waktu memakai `Intl.DateTimeFormat` dengan `timeZone` lokasi; label zona ditampilkan di dashboard |
| R5 | Rate limit / respons lambat Open-Meteo | Sedang | Sedang | Debounce, cache 10 menit, batalkan request usang (`AbortController`), tanpa polling |
| R6 | Waktu pengerjaan satu hari | Tinggi | Tinggi | Prioritas P0/P1/P2; peta (P2) dipotong lebih dulu; definisi "selesai" per iterasi |
| R7 | Peta/aset eksternal gagal dimuat | Rendah | Sedang | Leaflet dimuat lazy + `try/catch`; tile gagal → panel menampilkan pesan "Peta tidak dapat dimuat" + tautan koordinat; ilustrasi gagal → placeholder SVG lokal |
| R8 | Aset 3D tidak siap | Rendah | Sedang | Placeholder SVG lokal dipetakan per kondisi; aset final bisa ditukar tanpa mengubah kode (pemetaan di `wmo.js`) |
| R9 | Kode WMO tidak dikenal | Rendah | Rendah | Fallback label "Cuaca tidak diketahui" + ikon placeholder; tidak melempar error |
| R10 | LocalStorage tidak tersedia (mode privat) | Rendah | Rendah | `safeWrite` gagal secara senyap + banner kecil "Preferensi tidak dapat disimpan di perangkat ini" |
| R11 | Kontras buruk pada blok warna cerah | Sedang | Sedang | Teks selalu `--ink` di atas kuning/lime/cream; putih hanya pada coral gelap; verifikasi kontras manual |
| R12 | Endpoint AQI gagal / tidak ada data untuk lokasi | Sedang | Sedang | Panel AQI menampilkan empty/error state terisolasi + "Coba lagi"; dashboard cuaca tetap berfungsi; tidak menampilkan 0 palsu |
| R13 | Salah tafsir skala AQI (US vs European) | Sedang | Sedang | Selalu pakai `us_aqi` dan tampilkan label "US AQI"; ambang terpusat di `utils/aqi.js`; tidak memakai `european_aqi` |

---

## 8. Out of Scope

Tidak dikerjakan pada MVP ini, dan tidak boleh ditambahkan tanpa persetujuan eksplisit:

1. Backend, API proxy, atau database server.
2. Autentikasi/login (nyata maupun palsu), profil pengguna.
3. Dashboard administrator.
4. Notifikasi cuaca (push, email, alarm).
5. Prediksi/simulasi cuaca buatan sendiri atau model ML.
6. AI weather assistant / chat.
7. Sistem pembayaran atau langganan.
8. Aplikasi mobile native / PWA installable dengan offline penuh.
9. Fitur sosial, komunitas, komentar, berbagi ke media sosial.
10. Multi-bahasa (UI hanya Bahasa Indonesia; label cuaca Indonesia).
11. Geolokasi perangkat (GPS) sebagai lokasi awal.
12. Riwayat cuaca historis, polen, atau data marine.
13. Radar animasi real-time, layer cuaca raster komersial.
14. Heatmap/peta sebaran asap, data titik panas (hotspot) satelit, riwayat AQI historis, SO₂, dan rekomendasi kesehatan personal berbasis profil/riwayat medis. Aplikasi hanya menyajikan indikator informatif dari data Open-Meteo, bukan pemodelan atau diagnosis.

---

## 9. Acceptance Criteria (Uji Manual)

Prasyarat: aplikasi berjalan (`npm run dev`), koneksi internet aktif, DevTools terbuka pada tab Console.

| ID | Kriteria | Langkah pengujian | Hasil yang diharapkan |
|---|---|---|---|
| AC-01 | Dashboard menampilkan cuaca lokasi terpilih | Buka aplikasi pertama kali | Tampil nama lokasi (default Jakarta, berlabel "Lokasi contoh"), tanggal lokal, suhu, label kondisi, feels-like, ilustrasi, dan waktu pembaruan |
| AC-02 | Pencarian dan pemilihan kota | Ketik "Bandung" di kolom cari, tunggu 500 ms, klik hasil "Bandung, Indonesia" | Daftar hasil muncul (maks. 8) dengan nama + wilayah + negara; setelah dipilih, dashboard berganti ke Bandung |
| AC-03 | Data berubah saat lokasi diganti | Catat suhu/jam lokal Jakarta, lalu pilih kota lain (mis. "Tokyo") | Suhu, kondisi, jam lokal, dan seluruh panel (termasuk AQI) ikut berubah; tidak ada sisa data lokasi sebelumnya |
| AC-04 | Prakiraan per jam | Scroll ke bagian "Per jam" | Minimal 24 entri berurutan mulai jam berjalan, tiap entri punya jam, ikon, suhu, probabilitas hujan, angin; urutan waktu naik |
| AC-05 | Prakiraan 7 hari | Lihat bagian "7 Hari" | Tepat 7 kartu, tanggal berurutan, masing-masing punya ikon, maks/min, probabilitas hujan; hari ini ditandai |
| AC-06 | Informasi atmosfer sesuai API | Bandingkan panel atmosfer dengan respons API (DevTools → Network → Response) | Kelembapan, angin (km/j + arah), UV, tekanan (hPa), visibilitas (km) sama dengan nilai API pada jam berjalan (selisih hanya pembulatan tampilan) |
| AC-07 | Grafik suhu | Lihat panel grafik | Line chart memuat 24 titik suhu + feels-like; sumbu Y berskala wajar; tooltip menampilkan jam lokal dan nilai; tidak ada chart kosong saat data tersedia |
| AC-08 | Toggle Celsius/Fahrenheit | Klik toggle °C→°F, lalu kembali ke °C | Semua suhu (hero, hourly, daily, grafik) berubah konsisten; nilai °F = (°C × 9/5) + 32 dalam toleransi pembulatan 0,1; tidak ada permintaan forecast baru di Network |
| AC-09 | Tambah/hapus favorit | Klik "Simpan ke favorit" pada lokasi aktif, lalu klik ikon hapus pada item tersebut | Item muncul di daftar favorit; setelah dihapus hilang dari daftar; tidak ada duplikat saat menyimpan lokasi yang sama dua kali |
| AC-10 | Persistensi setelah reload | Set satuan °F, tambah 2 favorit, pilih kota X, lalu reload halaman | Satuan tetap °F, 2 favorit masih ada, lokasi X langsung termuat (tanpa harus mencari ulang) |
| AC-11 | Loading state | Buat request lambat (Network → Slow 3G) lalu ganti lokasi | Muncul skeleton/spinner pada panel terkait; layout tidak melompat berlebihan; kontrol tidak "membeku" tanpa indikasi |
| AC-12 | Error state dan retry | Network → Offline, klik "Perbarui" | Panel error informatif ("Tidak dapat memuat data cuaca"), tombol "Coba lagi"; setelah online dan tombol diklik, data termuat kembali tanpa reload halaman |
| AC-13 | Empty state | Cari string acak "zzzqqq" | Muncul pesan "Kota tidak ditemukan" (bukan panel error sistem); kolom input tetap bisa diedit |
| AC-14 | Responsif | Uji lebar 360 px, 768 px, 1280 px | Tidak ada horizontal scroll tak diinginkan; hero, hourly, daily, atmosfer, dan panel AQI tetap terbaca; tombol dapat ditekan tanpa tumpang tindih |
| AC-15 | Tanpa error JS tak tertangani | Lakukan AC-01 s.d. AC-22 dengan Console terbuka | Tidak ada `Uncaught`/`Unhandled rejection`; hanya log informasional yang disengaja |
| AC-16 | Kejujuran data & atribusi | Periksa footer dan seluruh UI | Terdapat atribusi Open-Meteo dan OSM (jika peta aktif); tidak ada blok data statis tanpa label DEMO; tidak ada klaim "real-time" palsu |
| AC-17 | Ketahanan LocalStorage | Di Console, set `localStorage['atmos.v1.favorites']='{rusak'`, lalu reload | Aplikasi tetap memuat, favorit kembali kosong dengan empty state, tidak ada crash |
| AC-18 | Timezone | Pilih kota dengan zona waktu berbeda (mis. "New York") | Jam pada hero, hourly, dan sunrise/sunset mengikuti waktu lokal kota tersebut, bukan waktu perangkat |
| AC-19 | Panel AQI sesuai API | Buka DevTools → Network → `air-quality`, bandingkan dengan panel AQI | Nilai AQI sama dengan `current.us_aqi` (dibulatkan), label "US AQI" tampil, waktu sesuai timezone lokasi |
| AC-20 | Kategori AQI konsisten dengan ambang | Uji 2–3 lokasi dengan nilai AQI berbeda (mis. AQI < 50 dan > 100), lalu periksa nilai batas 50/51, 100/101, 150/151, 200/201, 300/301 | Kategori, label, warna/pola sesuai tabel §3.2; kategori tetap terbaca tanpa mengandalkan warna; nilai batas tidak salah kategori |
| AC-21 | PM2.5 dan PM10 | Lihat kartu PM2.5 dan PM10 pada bento polutan (F15) | Nilai (µg/m³) tampil sesuai `current.pm2_5`/`current.pm10`, lengkap dengan progress bar ambang WHO; bila salah satu `null`, tampil "—" + status tidak tersedia, bukan 0 |
| AC-22 | Kegagalan AQI terisolasi | Blokir `air-quality-api.open-meteo.com` (DevTools → Block request URL), lalu muat ulang | Dashboard cuaca tetap normal; panel AQI menampilkan "Data kualitas udara tidak dapat dimuat" + "Coba lagi"; setelah blokir dilepas, retry memuat AQI tanpa reload |
| AC-23 | Hero kabut asap dinamis | Bandingkan AQI dengan latar hero, teks masker, dan aktivitas | Warna sesuai kategori (hijau/kuning/oranye/merah/ungu), status masker berubah (Tanpa Masker/Masker Medis/Wajib N95/KF94), estimasi rokok = PM2.5 ÷ 22 satu desimal |
| AC-24 | Bento polutan & visibilitas | Lihat enam kartu polutan dan bandingkan dengan respons `air-quality`/forecast | PM2.5, PM10, CO (mg/m³), NO2, O3, dan visibilitas (km) tampil; progress bar mengikuti ambang WHO; `null` → “—” bukan 0 |
| AC-25 | Tren & jam terbaik | Lihat panel tren udara | Grafik 24 jam memuat batang AQI berwarna, garis PM2.5, sumbu jam lokal; badge jam udara terbaik menampilkan rentang 3 jam dengan rata-rata AQI terendah |
| AC-26 | Arah angin & asap | Pilih lokasi dengan angin dari tenggara | Panel menampilkan “Tenggara · 135°”, kecepatan, dan asap bergerak ke barat laut (arah berlawanan) |
| AC-27 | Preset & leaderboard | Klik dua preset kota rawan karhutla | Kota ditambahkan/dipilih tanpa duplikat; leaderboard menampilkan udara terbersih dan terburuk setelah minimal dua lokasi memiliki AQI |
| AC-28 | Mobile 390 px | Uji lebar 390 px pada semua panel baru | Tidak ada scroll horizontal; grafik menyusut mengikuti lebar, chip preset wrap, kartu polutan tetap terbaca |

---

## 10. Implementation Plan (1 Hari)

Total anggaran ±9,25 jam kerja efektif + 0,75–1 jam buffer (total ±10 jam). Setiap iterasi punya definisi selesai (DoD) yang bisa diverifikasi tanpa menunggu iterasi berikutnya.

### Iterasi 1 — Project setup & design system (±1,25 jam)
- Scaffold Vite (vanilla), struktur direktori, `index.html` semantik, font lokal/fallback.
- `tokens.css` (palette, border, shadow, spacing, tipografi), `base.css` (reset, fokus, reduced-motion), komponen dasar: tombol, badge, kartu, input.
- Halaman statis dengan contoh blok (hero, kartu) untuk validasi visual.
- **DoD:** dev server berjalan; halaman kosong bertema Neo-Brutalist tampil benar di 360/768/1280 px; tidak ada error console.

### Iterasi 2 — Struktur layout & weather dashboard (±1,25 jam)
- Grid editorial asimetris + breakpoint; header (brand + pencarian placeholder + toggle satuan).
- Kerangka panel: hero dashboard, hourly, daily, atmosfer, chart, favorit, peta (placeholder).
- Skeleton/loader generik + komponen state (`states.js`).
- **DoD:** semua panel tampil dengan data dummy **di memori** berlabel DEMO; layout responsif; AC-14 lulus untuk kerangka.

### Iterasi 3 — Integrasi Open-Meteo & pencarian lokasi (±1,75 jam)
- `http.js` (timeout, AbortController, normalisasi error), `forecast.js`, `geocoding.js`, `weatherService.js` (mapping + cache TTL).
- Pencarian: debounce 350 ms, min 2 karakter, hasil maks. 8, status loading/empty/error.
- Pemuatan lokasi awal (lastLocation → default Jakarta), tombol "Perbarui".
- **DoD:** AC-01, AC-02, AC-03, AC-13 lulus dengan API nyata; label DEMO dihapus.

### Iterasi 4 — Hourly, daily, atmospheric metrics & AQI (±2,25 jam)
- `hourly.js` (scroll horizontal), `daily.js` (7 kartu), `atmosphere.js` (5 metrik + kategori UV + arah angin mata angin).
- Pemetaan WMO (`wmo.js`) + ilustrasi/placeholder per kondisi.
- Format waktu & tanggal berbasis timezone lokasi.
- **AQI (F13):** `airQuality.js` (endpoint terpisah) + `utils/aqi.js` (ambang, label, warna/pola) + `components/aqi.js` (angka, kategori, meter, PM2.5/PM10), dimuat paralel via `Promise.allSettled`.
- **DoD:** AC-04, AC-05, AC-06, AC-18, AC-19, AC-20, AC-21 lulus; nilai cocok dengan respons API.

### Iterasi 5 — Grafik suhu, favorit, LocalStorage (±1,25 jam)
- Chart.js lazy-load, line chart 24 jam responsif, unit-aware, tooltip jam lokal.
- Favorit: tambah/hapus, pindah lokasi, dedup, empty state.
- `storage.js`: preferensi satuan, favorit, lastLocation; validasi + fallback.
- **DoD:** AC-07, AC-08, AC-09, AC-10, AC-17 lulus.

### Iterasi 6 — Peta (opsional), responsive polish, testing (±1,5 jam + buffer 0,75 jam)
- Leaflet lazy-load + tile OSM + marker + kontrol layer sederhana **hanya jika** sumber layer stabil; jika tidak, panel keterangan "Peta tidak tersedia".
- Penyempurnaan responsif, hover/pressed state, kontras, fokus keyboard, `aria-live`.
- Uji manual AC-11, AC-12, AC-15, AC-16, AC-22; perbaikan bug; bersihkan log.
- **DoD:** seluruh AC P0 lulus; AC P1 lulus; P2 (peta) berstatus jelas (selesai atau ditandai belum tersedia).

### 10.1 Prioritas jika waktu tidak mencukupi (urutan pemotongan)
| Urutan potong | Item | Dampak | Syarat |
|---|---|---|---|
| 1 | F10 Weather map (P2) | Tidak ada peta | Panel menampilkan "Peta tidak tersedia" + koordinat; tidak ada layer palsu |
| 2 | Aset 3D final (F9) | Ilustrasi memakai placeholder SVG | Placeholder tetap konsisten secara visual |
| 3 | F8 Grafik suhu (P1) | Tanpa chart | Hourly tetap menampilkan data suhu sehingga tidak kehilangan informasi |
| 4 | Detail AQI lanjutan: polutan dominan + bar sub-indeks | Panel AQI lebih ringkas | Angka AQI, kategori, dan PM2.5/PM10 tetap tampil; fitur tidak dihilangkan |
| 5 | Animasi/hover polish | Interaksi lebih datar | Fokus & pressed state tetap ada |
| — | **Tidak boleh dipotong** | Dashboard, pencarian, hourly, daily, atmosfer, AQI (angka + kategori + PM2.5/PM10), toggle satuan, favorit, LocalStorage, state loading/error/empty | Aplikasi dianggap gagal bila salah satu hilang |

### 10.2 Buffer & strategi
- 45 menit buffer di akhir Iterasi 6 untuk bug integrasi (sumber bug tersering: mapping waktu/timezone dan penanganan `null` pada data AQI).
- Tidak mengerjakan fitur baru setelah Iterasi 5; sisa waktu hanya untuk stabilitas dan aksesibilitas.
- Jika API gagal saat pengujian, **jangan** menggantinya dengan data statis permanen; gunakan panel error resmi. Data contoh hanya untuk pengembangan awal dan wajib berlabel DEMO.

### 10.3 Definition of Done keseluruhan
1. Semua AC P0 lulus manual.
2. Tidak ada error JavaScript tak tertangani pada skenario AC-01…AC-22.
3. Preferensi dan favorit bertahan setelah reload.
4. Atribusi data tampil; tidak ada secret/API key di repositori.
5. Build produksi (`vite build`) berhasil tanpa warning kritis.
6. Status setiap fitur P1/P2 dilaporkan jujur (selesai / dipotong / belum tersedia).
