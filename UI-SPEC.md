# UI-SPEC — ATMOS Weather Explorer

**Versi:** 1.2 (selaras implementasi v1.3)
**Basis:** `SPEC.md` v1.3 (F1–F18, AC-01…AC-28) dan `TASKS.md` (M1–M11)
**Cakupan:** spesifikasi antarmuka, komponen, token visual, state, interaksi, dan wireframe. Tidak berisi kode.
**Target implementasi:** 1 hari (M1–M10), sesuai anggaran `TASKS.md` (9,25 j + 0,75 j buffer).

### 0.1 Catatan implementasi v1.1

Dokumen ini tetap menjadi acuan arah visual, tetapi implementasi memiliki penyimpangan yang disetujui dan terdokumentasi:

- **Palet aktual** sedikit disesuaikan agar kontras teks aman: `--solar #F5C445`, `--sky #BCD8E8`, `--coral #EF6B55`, `--lime #B8E06A`, `--paper #F4F0E6`, `--cream #F6F2E8`, `--ink #17171B`, `--ink-soft #55524A`. Tidak ada teks putih di atas coral/kuning.
- **Tipografi self-host**: Space Grotesk (display/mono) + Inter (body), subset latin dari `public/assets/fonts/`; ukuran hero diimplementasikan `clamp(76px, 17vw, 146px)` dan diskalakan ulang di desktop.
- **Struktur halaman**: header sticky (brand, pencarian kota, toggle ID/EN, toggle °C/°F, geolokasi) → status strip → ticker → main. Desktop ≥1280 px memakai grid `dashboard + rail lokasi 340 px`; rail sticky dan dapat di-scroll.
- **Bento grid**: 1 kolom (<640), 2 kolom (640–1023), 12 kolom (≥1024). Susunan desktop v1.3: hero kabut 12, polutan 7 + tren 5, AQI 4 + hero cuaca 8, angin 4 + hourly 8, daily 8 + chart 4, atmosfer 8 + matahari 4.
- **Komponen baru yang belum ada di wireframe awal**: hero kabut asap dinamis, bento 6 polutan, grafik tren AQI/PM2.5, panel AQI dengan meter 5 segmen + penanda, kompas angin 16 arah + arah asap, busur matahari (siang/malam), grafik SVG (garis suhu, garis putus-putus feels-like, bar hujan), ticker peringatan, status strip, toast geolokasi, chip preset karhutla, leaderboard udara, dan toggle bahasa.
- **Tema hero** memakai atribut `data-tone` (9 nilai) sehingga kontras tiap kondisi dapat diaudit di satu blok CSS; ilustrasi cuaca malam memakai bulan/bintang.
- **Motion**: hanya mikro-interaksi (hover shadow, ticker, float glyph) dan dimatikan oleh `prefers-reduced-motion`.
- **Target sentuh** kontrol utama 44×44 px; tombol aksi di kartu lokasi 30 px dengan padding area yang cukup.

---

## 1. Prinsip Desain

1. **Editorial, bukan dashboard SaaS.** Setiap blok punya proporsi, warna, dan tipe visual berbeda. Tidak ada grid kartu seragam.
2. **Bold by default.** Border hitam 2–3 px, hard offset shadow tanpa blur, tipografi tebal, sudut hampir tegak (0–6 px).
3. **Warna = informasi, bukan hiasan.** Kuning = hero/sorotan, biru langit = prakiraan, coral = peringatan/aksi hapus, lime = kondisi baik, cream = latar, ink = teks/border.
4. **Mobile-first.** Tata letak disusun untuk 360 px lebih dulu; desktop menambah kolom, bukan mengecilkan elemen.
5. **Data jujur terlihat di UI.** Label "US AQI", "Lokasi contoh", "Diperbarui HH.mm", dan atribusi selalu tampil.
6. **Tidak ada:** glassmorphism/backdrop-blur, gradient dekoratif, kartu seragam, sudut bulat besar (pill), shadow blur, teks putih di atas coral/kuning.

---

## 2. Design Tokens

### 2.1 Warna

| Token | Hex | Peran utama | Pemakaian |
|---|---|---|---|
| `--solar` | `#F9E547` | Hero, sorotan | Latar blok hero, badge UV tinggi, penanda "sekarang" |
| `--sky` | `#83B8FF` | Prakiraan | Blok hourly, ilustrasi, aksen grafik sekunder |
| `--coral` | `#FF765E` | Peringatan/aksi | UV tinggi, kategori AQI buruk, tombol hapus, strip error |
| `--lime` | `#B8E986` | Kondisi baik | Kategori AQI "Baik", badge feels-like, baris hari ini |
| `--cream` | `#F5F0E6` | Latar | Body, navbar, kartu netral |
| `--ink` | `#171717` | Teks/border | Semua teks, border, shadow, blok terbalik |
| `--paper` | `#FFFDF7` | Latar kartu netral | Kartu di atas cream agar terpisah tanpa shadow berlebih |
| `--muted` | `#5A554B` | Teks sekunder | Metadata, satuan, keterangan (di atas cream) |

**Aturan teks di atas blok warna:** selalu `--ink` pada `--solar`, `--sky`, `--lime`, `--cream`, `--coral`. Teks cream hanya di atas `--ink`. Tidak ada teks putih di atas coral atau kuning.

### 2.2 Tipografi

| Token | Font | Ukuran | Weight | Line-height | Tracking | Pakai |
|---|---|---|---|---|---|---|
| `--font-display` | Space Grotesk | `clamp(72px, 20vw, 144px)` | 700 | 0.82 | -0.04em | Suhu hero |
| `--font-h1` | Space Grotesk | `clamp(24px, 5vw, 40px)` | 700 | 1.05 | 0.01em | Nama kota (uppercase) |
| `--font-h2` | Space Grotesk | 13px | 700 | 1.2 | 0.14em | Judul seksi (uppercase) |
| `--font-h3` | Inter | 12px | 600 | 1.3 | 0.08em | Label kartu (uppercase) |
| `--font-metric` | Space Grotesk | `clamp(28px, 6vw, 44px)` | 700 | 1 | -0.02em | Nilai metrik, AQI |
| `--font-body` | Inter | 15px (mobile) / 16px | 400 | 1.55 | 0 | Teks paragraf |
| `--font-body-sm` | Inter | 13px | 500 | 1.45 | 0 | Metadata, satuan |
| `--font-button` | Space Grotesk | 14px | 700 | 1 | 0.04em | Tombol (uppercase) |

- Angka selalu `font-variant-numeric: tabular-nums` (Space Grotesk) agar tidak "meloncat" saat data berubah.
- Maksimal 3 tingkat ukuran dalam satu blok; hierarki dicapai lewat warna blok + border, bukan banyak ukuran.
- Judul seksi ditulis langsung sebagai teks uppercase, tanpa nomor urut (`01`, `02`, …) maupun penanda `///` di depan teks.

### 2.3 Spacing, border, shadow, radius, motion

| Token | Nilai |
|---|---|
| `--sp-1…--sp-10` | 4, 8, 12, 16, 20, 24, 32, 48, 64, 80 px |
| `--bw-1 / --bw-2 / --bw-3` | 2 px / 2.5 px / 3 px |
| `--shadow-sm` | `3px 3px 0 var(--ink)` |
| `--shadow-md` | `4px 4px 0 var(--ink)` |
| `--shadow-lg` | `6px 6px 0 var(--ink)` |
| `--shadow-xl` | `8px 8px 0 var(--ink)` |
| `--radius-0 / -1 / -2` | 0 / 2 px / 4 px |
| `--dur-fast / --dur-base` | 120 ms / 180 ms |
| `--ease` | `cubic-bezier(.2,.7,.3,1)` |
| `--z-header / --dropdown / --sheet / --toast` | 100 / 200 / 300 / 400 |

**Elevasi bersifat dekoratif-tegas:** hover menaikkan elemen 2 px (shadow membesar 1 px), pressed menurunkan 2 px (shadow mengecil). Tidak ada perubahan blur/opacity sebagai satu-satunya umpan balik.

### 2.4 Ikonografi
- Ikon garis 2 px, sudut tajam, warna `--ink`, ukuran 20/24/28 px (bukan ikon stok berujung bulat).
- Ikon cuaca utama memakai aset 3D/placeholder; ikon garis hanya untuk UI (cari, hapus, panah, bintang, plus, perbarui).
- Semua tombol berikon wajib punya `aria-label` + tooltip teks saat hover/focus.

### 2.5 Aset ilustrasi 3D
- Format `webp` (fallback `png`), latar transparan, sisi terpanjang 512 px, < 120 KB per aset.
- Gaya: bentuk gemuk, warna palette, outline gelap tebal, bayangan keras (bukan realistis).
- Dipetakan per kondisi WMO: cerah, cerah berawan, berawan, hujan ringan, hujan, badai, salju, kabut.
- Rotasi sticker −4°…+3° agar terasa playful; tidak ada animasi loop yang mengganggu (kecuali float 6 s yang dimatikan saat `prefers-reduced-motion`).

---

## 3. Kontras & Aksesibilitas Warna

Rasio dihitung terhadap latar blok (target WCAG AA teks normal ≥ 4.5:1):

| Kombinasi | Rasio | Status |
|---|---|---|
| `--ink` di `--cream` | ±16.6:1 | Lulus AAA |
| `--ink` di `--solar` | ±14.2:1 | Lulus AAA |
| `--ink` di `--lime` | ±13.0:1 | Lulus AAA |
| `--ink` di `--sky` | ±8.9:1 | Lulus AAA |
| `--ink` di `--coral` | ±6.9:1 | Lulus AA |
| `--cream` di `--ink` | ±16.2:1 | Lulus AAA |
| `--solar` di `--ink` | ±14.0:1 | Lulus AAA |
| `--paper` teks `--muted` | ±7.1:1 | Lulus AA |
| ~~cream di coral~~ | ±2.4:1 | **Dilarang** |
| ~~ink di `--muted`~~ | ±3.1:1 | **Dilarang** untuk teks normal |

Aturan tambahan:
- Kategori AQI tidak boleh dibedakan hanya dengan warna → selalu ada label teks + pola (hatch) untuk dua kategori terberat.
- Status interaktif (fokus) memakai outline 3 px `--ink` + offset 2 px, bukan perubahan warna saja.
- Target sentuh minimum 44×44 px (termasuk tombol hapus favorit yang visualnya 32 px).

---

## 4. Grid & Breakpoint (Mobile-First)

| Breakpoint | Lebar | Grid | Margin | Gutter | Perilaku |
|---|---|---|---|---|---|
| Base | 360–639 px | 4 kolom | 20 px | 16 px | Satu kolom; rail jadi bagian alur bawah |
| `sm` | 640–1023 px | 8 kolom | 24 px | 20 px | Hero 2 kolom; metrik 2 kolom; daily+chart tetap bertumpuk |
| `lg` | 1024–1279 px | 12 kolom | 32 px | 24 px | Main + rail 300 px; daily 7 kolom + chart 5 kolom |
| `xl` | ≥1280 px | 12 kolom | 40 px | 24 px | Rail 320 px; hero 62/38; hourly menampilkan 9–11 item |

**Grid area desktop:** `main` (minmax(0,1fr)) + `rail` (320 px, `position: sticky; top: 96px`).
**Urutan DOM (sama di semua breakpoint, diatur grid/order):**

1. Navbar (sticky) → 2. Status strip → 3. Hero → 4. AQI → 5. Hourly → 6. Daily 7 hari → 7. Chart → 8. Metrics atmosfer → 9. Favorit → 10. Peta → 11. Footer.

Rail desktop menampung **favorit** (dan hanya favorit). Pencarian berada di navbar pada desktop, dan pada mobile menjadi sheet terpisah agar tidak memakan tinggi layar.

> Catatan: pada desktop, favorit tampil di rail kanan; pada mobile tepat setelah metrik atmosfer. Tidak ada duplikasi komponen.

---

## 5. Wireframe ASCII

### 5.1 Desktop (≥1280 px)

```text
+----------------------------------------------------------------------------------------------+
| [O] ATMOS  WEATHER EXPLORER      [ cari kota .................. v ]  [ C | F ]   [ * ]      |  NAVBAR 72px
+----------------------------------------------------------------------------------------------+
| Diperbarui 08.42 WIB - Open-Meteo                                   [ Perbarui ]  ( live )   |  STATUS 32px
+-------------------------------------------------------------+--------------------------------+
| MAIN  minmax(0,1fr)                                         | RAIL 320px (sticky)            |
|                                                             |                                |
| +---------------------------- HERO -----------------------+ | +--------- FAVORIT (3) ------+ |
| | JAKARTA, INDONESIA                  [Lokasi contoh]     | | | Jakarta         AKTIF  x   | |
| | Rab, 19 Nov 2026 - 08.42 WIB                            | | | Bandung                x   | |
| |                                                         | | | Tokyo                  x   | |
| |  27.4        +-----------------------+                 | | +----------------------------+ |
| |  CERAH        |                       |                 | | | [ + Simpan lokasi ini ]    | |
| |  terasa 29.1 |     ILUSTRASI 3D      |                 | | +----------------------------+ |
| |               |      (sky blue)       |                 | |                                |
| | [UV 6][12 km/j][17.48]                |                 | |                                |
| +---------------------------------------------------------+ |                                |
|                                                             |                                |
| +---------------------------- AQI ------------------------+ |                                |
| |  42   BAIK / GOOD        US AQI     [meter 0 ==== 300+] | |                                |
| |  PM2.5 8 ug/m3   PM10 21 ug/m3                          | |                                |
| +---------------------------------------------------------+ |                                |
|                                                             |                                |
| +-------------------------- PER JAM ----------------------+ |                                |
| | [SEKARANG][09.00][10.00][11.00][12.00][13.00][14.00] -> | |                                |
| +---------------------------------------------------------+ |                                |
|                                                             |                                |
| +------------------- 7 HARI ------------------+ +--------+ |                                |
| | Rab ^ [===---]  31/24  hujan 40%            | | GRAFIK | |                                |
| | Kam ^ [====--]  30/24  hujan 60%            | |  /\\   | |                                |
| | ...                                         | | /  \\  | |                                |
| +---------------------------------------------+ +--------+ |                                |
|                                                             |                                |
| +------------------------ ATMOSFER ------------------------+ |                                |
| | [ Kelembapan 78% ] [ UV 6 TINGGI ] [   ANGIN (tall)  ]  | |                                |
| | [ Tekanan 1008 ]   [ Visibilitas 10 km ] [  NE 45   ]  | |                                |
| +---------------------------------------------------------+ |                                |
|                                                             |                                |
| +------------------------- PETA (P2) ---------------------+ |                                |
| +---------------------------------------------------------+ |                                |
+-------------------------------------------------------------+--------------------------------+
| FOOTER  Data cuaca: Open-Meteo (CC BY 4.0) - Peta: OpenStreetMap contributors                 |
+----------------------------------------------------------------------------------------------+
```

### 5.2 Mobile (360–639 px)

```text
+-------------------------------------------+
| [O] ATMOS            [ C | F ]   [ cari ]|  NAVBAR 64px
+-------------------------------------------+
| Diperbarui 08.42        [ Perbarui ]       |  STATUS 32px
+-------------------------------------------+
| +---------------------------------------+ |
| | JAKARTA, INDONESIA    [Lokasi contoh] | |
| | Rab, 19 Nov 2026 - 08.42 WIB          | |
| |                                       | |
| |  27.4                                | |
| |  CERAH                                | |
| |  terasa 29.1                         | |
| |                                       | |
| |           [ ILUSTRASI 3D ]            | |
| | [ UV 6 ] [ 12 km/j ] [ 17.48 ]        | |
| +---------------------------------------+ |
| +---------------------------------------+ |
| | 42   BAIK                    US AQI   | |
| | PM2.5 8 ug/m3 - PM10 21 ug/m3         | |
| | [ 0 ===========|============ 300+ ]   | |
| +---------------------------------------+ |
| PER JAM                         geser ->  |
| [SEKARANG][09][10][11][12][13] ...        |
| +---------------------------------------+ |
| | [?] hujan 40% | [^] 27.4 / 21.0       | |
| +---------------------------------------+ |
| 7 HARI                                    |
| Rab  ^  [===---]  31/24  [40%]  >         |
| Kam  ^  [====--]  30/24  [60%]  >         |
| ...                                       |
| GRAFIK SUHU 24 JAM                        |
| +---------------------------------------+ |
| | 32 |        .-^-.                      | |
| | 24 | .-^-'         '-.                | |
| | 16 +--------------------------         | |
| |    00   06   12   18   24               | |
| +---------------------------------------+ |
| ATMOSFER                                  |
| [ Kelembapan ]     [ UV INDEX ]           |
| [ Angin      ]     [ Tekanan  ]           |
| [ Visibilitas       ]                     |
| FAVORIT (3)                               |
| [ Jakarta        AKTIF   x ]              |
| [ Bandung                x ]              |
| [ + Simpan lokasi ini ]                   |
| PETA (P2, opsional)                       |
| FOOTER                                    |
+-------------------------------------------+
```

### 5.3 Detail hero (desktop, 62/38)

```text
+----------------------------------------------------------------+
| JAKARTA, INDONESIA                              [Lokasi contoh] |
| Rab, 19 Nov 2026 - 08.42 WIB                                    |
|                                                                 |
|  27.4C          +---------------------------+                  |
|  CERAH           |                           |                  |
|  terasa 29.1C   |        ILUSTRASI 3D       |                  |
|                  |      rotasi -4 deg        |                  |
|  [UV 6 TINGGI]   |                           |                  |
|  [ANGIN 12 km/j] +---------------------------+                  |
|  [SUNSET 17.48]                                                 |
+----------------------------------------------------------------+
```

### 5.4 Detail hourly (anatomi item)

```text
+--------+  +--------+  +--------+  +--------+
|SEKARANG|  | 09.00  |  | 10.00  |  | 11.00  |   <- 88px x 148px
|  [3D]  |  |  [3D]  |  |  [3D]  |  |  [3D]  |   <- ikon 36px
| 27.4  |  | 28.1  |  | 28.9  |  | 29.6  |   <- Space Grotesk 700
| v 10%  |  | v 10%  |  | v 20%  |  | v 35%  |   <- probabilitas hujan
| 12 km/j|  | 13 km/j|  | 14 km/j|  | 15 km/j|   <- kecepatan angin
+--------+  +--------+  +--------+  +--------+
  bg ink      bg paper    bg paper    bg paper
```

### 5.5 Detail atmosfer + AQI (mobile)

```text
+-------------------------+  +-------------------------+
| KELEMBAPAN              |  | UV INDEX                |
| 78%                     |  | 6                       |
| Nyaman                  |  | TINGGI                  |
+-------------------------+  +-------------------------+
+-------------------------+  +-------------------------+
| ANGIN                   |  | TEKANAN UDARA           |
| 12.4 km/j               |  | 1008 hPa                |
| NE - 45 deg             |  | Normal                  |
+-------------------------+  +-------------------------+
+-----------------------------------------------------+
| VISIBILITAS                                         |
| 10 km - Jelas                                       |
+-----------------------------------------------------+
+-----------------------------------------------------+
| 42  BAIK                                  US AQI    |
| Udara baik untuk aktivitas luar                     |
| [0 ======|==================== 300+]   marker ^     |
| PM2.5  8 ug/m3        PM10  21 ug/m3                |
+-----------------------------------------------------+
```

### 5.6 Detail pencarian (mobile sheet)

```text
+---------------------------------------+
| CARI KOTA                        [ x ]|
| +-----------------------------------+ |
| | bandung                         x | |
| +-----------------------------------+ |
| +-----------------------------------+ |
| | Bandung, Jawa Barat               | |
| | Indonesia                     (1) | |
| +-----------------------------------+ |
| | Bandung Barat, Jawa Barat         | |
| | Indonesia                     (2) | |
| +-----------------------------------+ |
| | Kota tidak ditemukan?             | |
| | Coba ejaan lain atau kota terdekat| |
+---------------------------------------+
```

### 5.7 Detail peta (fallback)

```text
+-----------------------------------------------+
| PETA LOKASI                    [ Dasar v ]    |
| +-------------------------------------------+ |
| |                                           | |
| |              + (marker)                   | |
| |           JAKARTA                         | |
| |                                           | |
| +-------------------------------------------+ |
| -6.2088, 106.8456 - (c) OpenStreetMap        |
+-----------------------------------------------+

Jika gagal:
+-----------------------------------------------+
| PETA TIDAK TERSEDIA                           |
| Koordinat: -6.2088, 106.8456                  |
| [ Buka di OpenStreetMap ]                     |
+-----------------------------------------------+
```

---

## 6. Navbar

| Properti | Mobile (base) | Desktop (lg+) |
|---|---|---|
| Tinggi | 64 px | 72 px |
| Posisi | `sticky; top: 0` | sama |
| Latar | `--cream` + border-bottom 3 px `--ink` | sama |
| Padding | 0 20 px | 0 32 px |
| Isi | brand, toggle °C/°F, tombol cari (ikon) | brand + tagline, input cari inline, toggle, tombol simpan lokasi |

**Brand:** kotak 28×28 px `--solar`, border 2 px, shadow `3px 3px 0`, berisi ikon matahari; wordmark "ATMOS" Space Grotesk 700, 20/24 px, uppercase, tracking 0.02em. Tagline "WEATHER EXPLORER" 11 px `--muted`, tracking 0.16em, sembunyi < 1024 px.

**Toggle °C/°F (segmented):**
- Wadah border 2.5 px, shadow `3px 3px 0`, radius 2 px, tinggi 40 px (desktop 44 px).
- Segmen 44×40 px, teks Space Grotesk 700 14 px.
- Aktif: latar `--ink`, teks `--cream`. Non-aktif: latar `--paper`, teks `--ink`.
- Hover segmen non-aktif: latar `--lime`. Pressed: `translate(1px,1px)` + shadow 2 px.
- `aria-pressed` per segmen; seluruh grup berlabel "Satuan suhu".

**Tombol cari (mobile):** 44×44 px, border 2 px, shadow 3 px, ikon kaca pembesar 20 px. Membuka sheet pencarian (z 300) dengan fokus otomatis ke input.

**Status strip (di bawah navbar):** tinggi 32 px, latar `--paper`, border-bottom 2 px, teks 13 px `--muted`: "Diperbarui 08.42 WIB · Open-Meteo". Di kanan: tombol "Perbarui" 14 px dengan ikon panah melingkar. Saat memuat: teks diganti "Memperbarui…" + indikator titik tiga.

---

## 7. Hero Cuaca

**Blok:** latar `--solar`, border 3 px, shadow `8px 8px 0`, radius 4 px, padding 20 px (mobile) / 32 px (desktop). Grid dalam: 1 kolom (mobile, ilustrasi di bawah teks), 62/38 (desktop).

| Elemen | Spesifikasi |
|---|---|
| Nama kota | H1 Space Grotesk 700, uppercase, `clamp(24px,5vw,40px)`, maksimal 2 baris (ellipsis setelahnya) |
| Badge lokasi contoh | 11 px uppercase, latar `--paper`, border 2 px, shadow 2 px, hanya bila lokasi default |
| Tanggal & jam | Inter 13/14 px: `Rab, 19 Nov 2026 · 08.42 WIB` — timezone lokasi |
| Suhu | Space Grotesk 700, `clamp(72px,20vw,144px)`, line-height 0.82, dengan derajat sebagai superscript 0.35em |
| Kondisi | Space Grotesk 600 20/24 px, uppercase, + ikon 3D 56–72 px |
| Feels-like | Badge `--lime`, border 2 px, teks "terasa 29.1°C", 13 px |
| Chip info | 3 chip: UV (kategori), angin, sunset. Border 2 px, latar `--paper`, shadow 3 px, 12 px uppercase |
| Ilustrasi | Blok `--sky`, border 3 px, shadow 6 px, ilustrasi 180/260 px, rotasi −4°, sudut "sticker" opsional |

**Perilaku:**
- Suhu berganti satuan tanpa animasi angka (hindari flicker); perubahan langsung.
- Saat loading pertama: skeleton untuk semua baris (lihat §17), hero tetap mempertahankan tinggi minimum 320 px agar tidak melompat.
- Hover pada blok hero: tidak menggeser (blok besar tidak "melayang"); hanya ilustrasi naik 2 px.
- Klik pada koordinat/badge lokasi tidak melakukan apa pun (bukan tautan) pada MVP.

---

## 8. Hourly Forecast

**Blok:** latar `--paper`, border 3 px, shadow `6px 6px 0`, padding 16 px. Header seksi: `PER JAM` (13 px uppercase) + petunjuk "geser →" 12 px `--muted` (mobile saja).

**Strip:** `display:flex; gap:12px; overflow-x:auto; scroll-snap-type:x mandatory; padding-bottom:8px;` dengan scrollbar tipis 6 px ber-border. Item `flex: 0 0 88px` (desktop 96 px), tinggi 148 px.

| Bagian item | Spesifikasi |
|---|---|
| Label waktu | 12 px uppercase; item pertama "SEKARANG" |
| Ikon | 36 px (aset 3D/placeholder) |
| Suhu | Space Grotesk 700 18 px, tabular |
| Probabilitas hujan | 12 px dengan ikon tetes 12 px; 0% tetap ditampilkan sebagai "0%" agar pola konsisten |
| Angin | 11 px `--muted` |

**State item:** item "sekarang" memakai latar `--ink` + teks `--cream` + aksen `--solar` pada label. Item lain `--paper`. Hover item: naik 2 px; klik tidak melakukan navigasi (bukan tombol) — hindari affordance palsu.

**Scroll:** snap per item; di desktop tampil 9–11 item tanpa scroll; di mobile 3,5 item (mengisyaratkan masih ada konten).

---

## 9. Weekly Forecast (7 Hari)

**Blok:** latar `--cream`, border 3 px, shadow `6px 6px 0`, padding 16–24 px. Header: `7 HARI`.

**Baris (bukan kartu seragam):** grid `92px 40px 1fr 96px`, tinggi 60 px, border-bottom 2 px `--ink` (baris terakhir tanpa border). Baris hari ini: latar `--lime`, border kiri 4 px `--ink`, label "HARI INI" 10 px.

| Kolom | Isi |
|---|---|
| Hari | "Rab" 15 px 700 + tanggal "19/11" 11 px `--muted` |
| Ikon | 32 px |
| Bar rentang suhu | Track 10 px tinggi, border 2 px, latar `--paper`; segmen rentang `--coral` (maks) hingga `--sky` (min) tanpa gradient — dua blok bersambung |
| Suhu | `31° / 24°` Space Grotesk 700 15 px, tabular, rata kanan |
| Probabilitas | Badge kecil 11 px di bawah suhu (mobile: di baris kedua bila sempit) |

**Interaksi:** hover baris menaikkan latar ke `--paper` + translasi 0 (hindari goyang pada daftar); fokus keyboard pada baris memberi outline. Baris tidak dapat diklik (tidak ada detail harian di MVP).

---

## 10. Atmospheric Metrics

**Blok:** header `ATMOSFER`. Grid 12 kolom (desktop) / 2 kolom (tablet, kecuali angin) / 2 kolom (mobile).

| Metrik | Span desktop | Warna blok | Isi |
|---|---|---|---|
| Kelembapan | 4 | `--paper` | Nilai 78%, caption "Nyaman" bila 30–70%, "Lembap"/"Kering" di luar |
| UV Index | 4 | `--paper` + aksen `--coral` bila ≥ 6 | Nilai bulat + kategori (RENDAH/SEDANG/TINGGI/SANGAT TINGGI/EKSTREM) |
| Angin | 4 (2 baris, tinggi) | `--sky` | Kecepatan 12.4 km/j, arah `NE · 45°`, kompas mini 72 px dengan panah |
| Tekanan | 4 | `--paper` | 1008 hPa + caption "Normal" (rentang 980–1030) |
| Visibilitas | 4 | `--paper` | 10 km (dari meter) + caption "Jelas" |

**Gaya kartu:** border 2.5 px, shadow `4px 4px 0`, radius 2 px, padding 16 px, min-height 96 px (angin 208 px). Label 12 px uppercase; nilai Space Grotesk 700 32/40 px; caption 12 px `--muted`.

**Nilai tidak tersedia:** tampilkan "—" 32 px + caption "tidak tersedia". Jangan pernah menampilkan 0 untuk data `null`.

**Kompas angin:** lingkaran 72 px border 2 px, huruf N/T/S/B 11 px di tepi, panah 28 px berputar sesuai derajat (`transform: rotate()`), transisi 180 ms; tanpa animasi saat reduced motion.

---

## 11. Panel AQI (F13)

**Blok:** latar `--paper`, border 3 px, shadow `6px 6px 0`, padding 16/24 px, lebar penuh kolom main. Header kecil: `KUALITAS UDARA` + label kanan "US AQI" 11 px uppercase (wajib, selalu terlihat).

**Struktur (2 zona, desktop horizontal; mobile bertumpuk):**

1. **Angka + kategori:** nilai AQI Space Grotesk 700 `clamp(40px,8vw,64px)` tabular; badge kategori `--font-h3` uppercase dengan latar sesuai ambang §3.2 SPEC; satu baris anjuran singkat 13 px (contoh: "Udara baik untuk aktivitas luar").
2. **Meter:** track 12 px, border 2 px, latar `--cream`; 6 segmen ditandai garis 2 px pada batas 50/100/150/200/300; marker segitiga 10 px menunjuk posisi nilai (dibatasi 0–300+, nilai >300 menempel di ujung kanan dengan label "300+"). `role="img"` + `aria-label` berisi nilai dan kategori.

Rincian polutan dipindahkan ke bento tersendiri (F15, §11A.2) agar tidak duplikatif dengan panel AQI.

**Warna per kategori** (dari SPEC §3.2, tanpa hex baru):

| Kategori | Latar blok | Teks | Pola |
|---|---|---|---|
| Baik (0–50) | `--lime` | `--ink` | solid |
| Sedang (51–100) | `--solar` | `--ink` | solid |
| Tidak Sehat — Grup Sensitif (101–150) | `--coral` | `--ink` | hatch diagonal 45° |
| Tidak Sehat (151–200) | `--coral` | `--ink` | hatch silang |
| Sangat Tidak Sehat (201–300) | `--ink` | `--cream` | solid |
| Berbahaya (301+) | `--ink` | `--solar` | hatch diagonal |

Pola dibuat dengan `repeating-linear-gradient` tipis (pola, bukan gradient dekoratif) atau SVG pattern lokal; opasitas ≤ 0.18 agar teks tetap kontras.

**State:** loading (skeleton 3 baris), error (pesan + "Coba lagi" kecil, hanya di panel ini), unavailable ("Data kualitas udara tidak tersedia untuk lokasi ini"), sukses (default). Panel **tidak** ikut mengosongkan dashboard saat gagal.

---

## 11A. Hero Kabut Asap, Polutan & Tren (F14–F18)

### 11A.1 Hero kabut asap

Blok penuh 12 kolom, border 3 px + hard shadow, padding 16/20 px. Latar mengikuti `data-level` kategori AQI:

| Level | Latar | Teks |
|---|---|---|
| `good` | `--air-good` (`#b8e06a`) | `--ink` |
| `moderate` | `--air-moderate` (`#f5c445`) | `--ink` |
| `sensitive` | `--air-sensitive` (`#f39a4b`) | `--ink` |
| `unhealthy` | `--air-unhealthy` (`#ef6b55`) | `--ink` |
| `very_unhealthy` | `--air-very-unhealthy` (`#8b5aa6`) | `--cream` |
| `hazardous` | `--air-hazardous` (`#4a2b5c`) | `--cream` |

Isi: eyebrow `STATUS KABUT ASAP`, judul, timestamp; angka AQI besar + label/badge; PM2.5; kartu masker (latar `--paper`; N95 dibalik `--ink`/`--cream`), dua kartu advisori (aktivitas luar, kelompok sensitif), dan kartu setara rokok `--solar` (angka + `batang / hari` + catatan estimasi). Di ≥560 px susun dua kolom; di mobile satu kolom. Semua kartu memakai teks `--ink` agar kontras di latar level apa pun.

**Masker:** good/moderate → “Tanpa Masker”; sensitive → “Masker Medis”; unhealthy ke atas → “Wajib N95/KF94”. Angka rokok = PM2.5 ÷ 22, satu desimal.

### 11A.2 Bento polutan

Grid 2 kolom (mobile) / 3 kolom (≥560 px). Enam kartu `--paper`, border 2 px, shadow 3 px. Tiap kartu: nama polutan, badge status, nilai + satuan, ambang WHO, progress bar 10 px.

| Kartu | Ambang | Satuan tampil | Status |
|---|---|---|---|
| PM2.5 | 15 | µg/m³ | ≤50% aman, ≤100% mendekati, >100% melebihi |
| PM10 | 45 | µg/m³ | sama |
| CO | 4 | mg/m³ (API µg/m³ × 0.001) | sama |
| NO2 | 25 | µg/m³ | sama |
| O3 | 100 | µg/m³ | sama |
| Jarak pandang | 10 | km (API meter × 0.001) | ≥100% aman, ≥50% mendekati, <50% melebihi |

Isi progress bar memakai warna status (lime/kuning/coral); kategori “melebihi” juga memakai pola garis. Nilai `null` → “—” dan bar 0%, bukan 0.

### 11A.3 Tren 24 jam

SVG native `width:100%; height:auto`, viewBox ±560×240. Latar grafik `--paper`, grid horizontal putus-putus. Batang AQI per kategori; garis PM2.5 `--violet` 3 px dengan titik `--paper`; sumbu kiri AQI, sumbu kanan PM2.5. Zona jam terbaik berupa rect lime transparan bergaris putus-putus. Badge di bawah grafik: label `JAM UDARA TERBAIK`, rentang `13.00 – 15.00`, rata-rata AQI. Footer menampilkan puncak AQI + jam. Legenda “AQI” (gradien tiga warna) dan “PM2.5” (garis violet).

### 11A.4 Radar angin & asap

Pertahankan dial 132 px. Readout: kecepatan (`km/j`), arah `Tenggara · 135°` (mata angin terlokalisasi + derajat), hembusan, lalu kartu kecil `Pergerakan asap` berisi “Asap bergerak ke arah Barat Laut”. Arah asap = derajat angin + 180°. Bila derajat bukan angka → “—”.

### 11A.5 Preset & leaderboard

Di panel lokasi, di bawah pencarian: label `TAMBAH CEPAT KOTA RAWAN KARHUTLA`, chip wrap 2 kolom di 390 px berisi nama + provinsi. Chip tersimpan memakai latar lime. Klik = tambah/pilih lokasi tanpa duplikat.

Leaderboard di bawah daftar lokasi: judul `UDARA TERBERSIH VS TERBURUK`, dua kartu (Terbersih hijau, Terburuk coral) berisi nama, `AQI n`, dan badge kategori; klik kartu = pindah lokasi. Tampil hanya bila minimal dua lokasi punya AQI numerik; jika belum, tampilkan empty state satu baris.

### 11A.6 Responsif & aksesibilitas

- Uji utama 390 px: dashboard satu kolom; grid polutan 2 kolom; badge tren dan chip preset wrap; tidak ada `min-width` yang memaksa scroll horizontal.
- SVG grafik memakai `width:100%`, bukan lebar piksel tetap.
- Warna level tidak menjadi satu-satunya pembeda: selalu ada label kategori/status dan teks masker.
- Progress bar memakai `role="progressbar"`, `aria-valuemin/max/now`, dan `aria-label` berisi polutan, nilai, serta ambang.
- Jam terbaik diumumkan lewat `aria-label` pada badge; grafik punya `role="img"` + ringkasan.

---

## 12. City Search & Autocomplete

**Desktop:** input inline di navbar, lebar 260–360 px, tinggi 48 px, border 2.5 px, shadow 3 px, radius 2 px, ikon cari 20 px di kiri, tombol clear 20 px di kanan saat ada teks.
**Mobile:** tombol 44×44 px membuka **sheet** penuh (z 300, latar `--cream`, border bawah 3 px), header "CARI KOTA" + tombol tutup 44 px, input 52 px, hasil di bawahnya.

**Input:** placeholder "Cari kota…" 15 px; fokus: `translate(-1px,-1px)` + shadow 5 px; border tetap 2.5 px (tanpa glow).
**Dropdown:** menempel di bawah input, latar `--paper`, border 2.5 px, shadow `6px 6px 0`, maks-tinggi 320 px, scroll internal. Jarak antar item 1 px border-bottom.
**Item hasil:** tinggi 56 px, padding 12/16 px; baris 1 nama kota 16 px 600 + badge kecil "(1)"; baris 2 "Jawa Barat, Indonesia" 12 px `--muted`; hover/fokus latar `--lime`; item aktif keyboard diberi outline 2 px.

**Perilaku:**
- Debounce 350 ms; minimal 2 karakter; maksimal 8 hasil.
- `↑/↓` memindah item aktif, `Enter` memilih, `Esc` menutup dan mengembalikan fokus ke input/tombol cari.
- Memilih hasil: tutup dropdown/sheet, muat lokasi, tampilkan loading pada panel data (bukan seluruh halaman), pertahankan tinggi hero.
- Empty: "Kota tidak ditemukan. Coba ejaan lain." + saran 2 kota populer (statis, jelas bukan data cuaca).
- Error jaringan: teks inline "Pencarian gagal. Periksa koneksi." + tombol "Coba lagi" kecil.

**ARIA:** `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, listbox `role="listbox"`, item `role="option"` + `aria-selected`.

---

## 13. Temperature Chart

**Blok:** header `GRAFIK SUHU 24 JAM` + legenda chip: "Suhu" (garis ink 3 px), "Terasa" (garis putus-putus coral 2 px). Kanvas tinggi 220 px (mobile) / 280 px (desktop), latar `--paper`, border 2.5 px, shadow 4 px, padding 12 px.

**Gaya Chart.js:**
- Garis suhu: `--ink` 3 px, `tension 0.25`, tanpa fill.
- Garis terasa: `--coral` 2 px, `borderDash [4,4]`, tanpa fill.
- Grid: `rgba(23,23,23,0.12)` 1 px horizontal saja; sumbu tanpa border tebal (border kotak sudah dari container).
- Tick: Inter 11 px `--muted`; label jam tiap 3 jam (`00, 03, …`), mengikuti timezone lokasi.
- Tooltip: latar `--ink`, teks `--cream`, border 2 px, radius 0, padding 8/10 px, judul "14.00", isi "Suhu 27.4°C · Terasa 29.1°C".
- Titik: radius 0 saat normal, 4 px saat hover.
- Animasi 250 ms; dimatikan pada reduced motion.

**Perilaku unit:** chart dibuat ulang saat satuan berubah (destroy + create) memakai data yang sudah ada di state — tanpa request API. Sumbu Y diberi label satuan (`°C`/`°F`).
**Fallback:** jika Chart.js gagal dimuat, tampilkan daftar ringkas "jam — suhu" (tabel 6 baris) dengan catatan "Grafik tidak dapat dimuat".

---

## 14. Favorite Locations

**Desktop rail:** kartu sticky, border 3 px, shadow 6 px, padding 16 px, header `FAVORIT (3)` + hitungan. **Mobile:** blok penuh setelah atmosfer.

**Item:** tinggi 56 px, border 2.5 px, shadow 3 px, padding 10/12 px, latar `--paper`; nama 15 px 600, negara 11 px `--muted`.
- Lokasi aktif: latar `--solar`, badge "AKTIF" 10 px, border kiri 4 px.
- Hover: naik 2 px, shadow 4 px.
- Tombol hapus: kotak 32 px visual (area sentuh 44 px), ikon × 18 px, latar `--paper`, border 2 px; hover latar `--coral` (ikon tetap `--ink`), `aria-label="Hapus Jakarta dari favorit"`.
- Fokus keyboard: outline 2 px + offset 2 px pada item dan tombol hapus; `Enter` pada item = pindah lokasi.

**Tombol simpan:** lebar penuh, tinggi 44 px, border 2.5 px, shadow 4 px, teks "+ SIMPAN LOKASI INI". Saat lokasi sudah favorit: label berubah "TERSIMPAN" + latar `--lime` + `disabled` (opacity tetap 1, cursor default) — bukan tombol hilang.
**Batas 20:** saat penuh, tombol nonaktif + pesan "Maksimal 20 lokasi favorit".
**Empty:** border putus-putus 2 px, ikon bintang garis 32 px, teks "Belum ada lokasi favorit" + "Cari kota lalu simpan." Tombol simpan tetap ada di atas empty state.

---

## 15. Weather Map (P2, opsional)

**Blok:** header `PETA LOKASI` + kontrol kanan: select layer "Dasar" (satu-satunya layer yang dijamin), tombol zoom ±40 px. Tinggi 200 px (mobile, rasio 16:9) / 320 px (desktop). Border 3 px, shadow 6 px, radius 2 px.

- Leaflet dimuat `import()` saat panel mendekati viewport (IntersectionObserver, rootMargin 200 px).
- Marker: divIcon kotak 18 px `--solar` + border 3 px + shadow 2 px (bukan pin bulat).
- Atribusi OSM wajib terlihat, 10 px, di sudut bawah dengan latar `--paper`.
- Tile gagal (offline/blokir): panel diganti pesan "Peta tidak tersedia" + koordinat + tombol "Buka di OpenStreetMap" (tautan eksternal).
- Tidak ada layer cuaca raster buatan sendiri; jika tidak ada sumber layer stabil, select layer disembunyikan.
- Peta tidak pernah menghalangi scroll vertikal halaman: `dragging` hanya aktif setelah klik/fokus pada peta (mobile), atau tampilkan overlay "Aktifkan peta" bila perlu.

**Jika dipotong:** panel tetap dirender dengan pesan "Peta tidak tersedia pada versi ini" + koordinat; jangan hapus section.

---

## 16. Toggle Celsius/Fahrenheit

| Aspek | Spesifikasi |
|---|---|
| Kontrol | Segmented 2 tombol pada navbar (lihat §6) |
| Cakupan | Hero, feels-like, hourly, daily, chart (garis + tooltip + sumbu), AQI **tidak** terpengaruh |
| Konversi | Terpusat di `utils/format.js`; tampilan 1 desimal; contoh 27.4°C → 81.3°F |
| Persistensi | Ditulis ke `atmos.v1.preferences` segera setelah perubahan |
| Feedback | Tanpa animasi angka; `aria-live="polite"` mengumumkan "Satuan diubah ke Fahrenheit" |
| Keyboard | `←/→` memindah segmen bila fokus berada di grup (roving tabindex) |

Label satuan selalu ikut tampil (tidak hanya simbol derajat) pada nilai utama: `27.4°C`.

---

## 17. UI States

### 17.1 Matriks state per wilayah

| Wilayah | Loading | Success | Empty | Error |
|---|---|---|---|---|
| Hero | Skeleton 4 baris + blok ilustrasi | Data lengkap | — (tidak mungkin) | Panel error besar + retry |
| Hourly | 8 skeleton item | 24 item | "Data prakiraan per jam tidak tersedia" | Pesan inline + retry kecil |
| Daily | 7 skeleton baris | 7 baris | "Data prakiraan 7 hari tidak tersedia" | Pesan inline + retry |
| Atmosfer | 5 skeleton tile | 5 metrik | Nilai "—" per metrik | Pesan inline |
| AQI | Skeleton 3 baris | Angka + kategori | `unavailable` bila `us_aqi` null | Pesan + "Coba lagi" (terisolasi) |
| Hero kabut | Skeleton angka + 2 baris | AQI, masker, advisori, setara rokok | `unavailable` bila `us_aqi` null | Pesan + retry AQI |
| Polutan | Kartu bernilai “—” | 6 kartu + progress bar | Status tidak tersedia per polutan | Nilai “—”, panel tetap tampil |
| Tren AQI | — | Batang + garis + badge jam terbaik | “Data tren tidak tersedia” | — |
| Chart | Placeholder kotak + spinner | Garis | "Data grafik tidak tersedia" | Fallback tabel |
| Pencarian | Baris "Mencari…" + 2 skeleton | ≤8 hasil | "Kota tidak ditemukan" | "Pencarian gagal" + retry |
| Favorit | — (instan, lokal) | Daftar | Empty state | — |

### 17.2 Skeleton
- Blok `--paper` dengan border 2.5 px `--ink` 20% (garis putus-putus) dan animasi opacity 0.55↔1.0 selama 1.2 s (dimatikan pada reduced motion).
- Tidak memakai gradient shimmer.
- Tinggi skeleton = tinggi konten final (±4 px) agar Cumulative Layout Shift minimal.

### 17.3 Error
- **Blok error utama (hero):** latar `--paper`, border 3 px, strip atas `--coral` 8 px, ikon awan-garis 40 px, judul "Data cuaca tidak dapat dimuat" 20 px 700, pesan penyebab spesifik (offline/timeout/server), tombol "COBA LAGI" 44 px, tautan kecil "Lihat detail teknis" (membuka `<details>` berisi kode error).
- **Inline error:** satu baris 13 px + tombol teks "Coba lagi", tanpa memindahkan layout.
- **Banner offline:** lebar penuh, latar `--ink`, teks `--cream` 13 px: "Kamu sedang offline. Menampilkan data terakhir pukul 08.42." (bila ada data lama) atau "Kamu sedang offline." (bila tidak ada).
- **Toast** (error tak terduga): 320 px, border 2.5 px, shadow 4 px, latar `--coral`, teks `--ink`, auto-dismiss 6 s, `role="status"`. Tidak menutupi tombol utama.

### 17.4 Empty
- Border putus-putus 2 px `--ink` 40%, padding 24 px, ikon 32 px, judul 15 px 700, keterangan 13 px `--muted`, maksimal satu aksi.
- Nada playful tetapi netral; tidak menyalahkan pengguna.

### 17.5 Success (default)
- Tidak ada toast sukses untuk operasi rutin (muat data, ganti kota). Umpan balik cukup dari perubahan konten.
- Toast hanya untuk aksi yang tidak terlihat hasilnya: "Jakarta ditambahkan ke favorit", "Favorit dihapus".

### 17.6 State khusus
- **Lokasi contoh:** badge "Lokasi contoh" 11 px pada hero (bukan toast).
- **DEMO:** pita `--coral` 3 px border, teks "DEMO — BUKAN DATA CUACA NYATA", 11 px uppercase, rotasi −2°, hanya di lingkungan pengembangan.
- **Data AQI tidak tersedia:** teks abu `--muted`, bukan 0 dan bukan error merah.
- **Stale data:** label "Data terakhir 08.42" pada status strip + warna `--solar` di strip.

---

## 18. Interaksi & Motion

| Elemen | Hover | Focus | Pressed | Nonaktif |
|---|---|---|---|---|
| Tombol primer | naik 2 px, shadow +1 | outline 3 px | turun 2 px, shadow −1 | opacity 1, latar `--cream`, border 2 px putus, cursor not-allowed |
| Tombol ikon (hapus) | latar `--coral` | outline 3 px | `translate(1px,1px)` | `--muted` |
| Kartu metrik | naik 2 px | outline 2 px | — | — |
| Item hourly | naik 2 px | outline 2 px | — | — |
| Baris daily | latar `--paper` | outline 2 px | — | — |
| Item favorit | naik 2 px | outline 2 px | turun 1 px | — |
| Segmen °C/°F | latar `--lime` | outline 3 px | `translate(1px,1px)` | — |
| Input | border tetap, shadow +1 | `translate(-1px,-1px)` | — | latar `--cream` |

**Aturan umum:**
- Durasi 120–180 ms, hanya `transform`, `box-shadow`, `background-color`. Tidak ada animasi `width/height/top/left`.
- Tidak ada animasi pada data yang sedang dimuat ulang (hindari kedip).
- `prefers-reduced-motion: reduce` → semua transisi 0 ms; ilustrasi 3D statis; chart tanpa animasi.
- Hover hanya untuk perangkat dengan pointer presisi (`@media (hover: hover)`), agar tidak "menempel" di mobile.
- Scroll horizontal hourly memakai `scroll-snap`; tidak ada auto-scroll.

---

## 19. Aksesibilitas (Checklist Wajib)

- [ ] Skip link "Lewati ke konten utama" 44 px, terlihat saat fokus.
- [ ] Struktur heading: `h1` nama kota → `h2` per seksi (PER JAM, 7 HARI, GRAFIK, ATMOSFER, KUALITAS UDARA, FAVORIT, PETA) → `h3` label kartu.
- [ ] Semua kontrol dapat dijangkau Tab dalam urutan logis; tidak ada `tabindex > 0`.
- [ ] Fokus selalu terlihat (3 px ink + offset 2 px) di latar apa pun; pada blok ink gunakan `--cream`.
- [ ] `aria-live="polite"` untuk: status pembaruan, hasil pencarian, perubahan satuan, error utama.
- [ ] Combobox pencarian sesuai pola ARIA (expanded, controls, activedescendant).
- [ ] Setiap ilustrasi punya `alt` deskriptif ("Ilustrasi 3D matahari dan awan"); ikon dekoratif `aria-hidden`.
- [ ] Tombol ikon punya nama aksesibel; tombol hapus menyebut nama kota.
- [ ] Meter AQI punya `role="img"` + `aria-label="US AQI 42, kategori Baik"`.
- [ ] Kontras sesuai tabel §3; kategori AQI tidak bergantung warna.
- [ ] Zoom 200% tidak memotong konten horizontal (grid kolaps).
- [ ] Target sentuh ≥ 44 px, termasuk tombol hapus dan segmen toggle.
- [ ] Bahasa halaman `lang="id"`.

---

## 20. Microcopy

| Konteks | Teks |
|---|---|
| Memuat data | "Memuat data cuaca…" |
| Memperbarui | "Memperbarui…" |
| Error utama | "Data cuaca tidak dapat dimuat" |
| Sub-error offline | "Periksa koneksi internet, lalu coba lagi." |
| Sub-error server | "Server cuaca sedang bermasalah. Coba beberapa saat lagi." |
| Tombol retry | "Coba lagi" |
| Offline + data lama | "Kamu sedang offline. Menampilkan data terakhir pukul 08.42." |
| Petunjuk pencarian | "Ketik minimal 2 huruf" |
| Hasil kosong | "Kota tidak ditemukan. Coba ejaan lain." |
| Error pencarian | "Pencarian gagal. Periksa koneksi." |
| Favorit kosong | "Belum ada lokasi favorit. Cari kota lalu simpan." |
| Favorit penuh | "Maksimal 20 lokasi favorit" |
| Tersimpan | "Tersimpan" |
| AQI tidak tersedia | "Data kualitas udara tidak tersedia untuk lokasi ini" |
| Peta gagal | "Peta tidak tersedia" |
| Grafik gagal | "Grafik tidak dapat dimuat" |
| Label demo | "DEMO — BUKAN DATA CUACA NYATA" |
| Atribusi | "Data cuaca: Open-Meteo (CC BY 4.0) · Peta: OpenStreetMap contributors" |
| Perubahan satuan | "Satuan diubah ke Fahrenheit" |

Gaya bahasa: kalimat pendek, aktif, tanpa istilah teknis di UI utama; tidak ada seruan berlebihan atau emoji.

---

## 21. Traceability ke SPEC

| Fitur | Seksi UI-SPEC | Komponen | Berkas terkait |
|---|---|---|---|
| F1 Dashboard | §6, §7 | header, dashboard | `src/components/dashboard.js` |
| F2 Hourly | §8 | hourly | `src/components/hourly.js` |
| F3 Weekly | §9 | daily | `src/components/daily.js` |
| F4 Metrik atmosfer | §10 | atmosphere | `src/components/atmosphere.js` |
| F5 Pencarian | §12 | search/header | `src/components/search.js` |
| F6 Favorit | §14 | favorites | `src/components/favorites.js` |
| F7 °C/°F | §16, §6 | header, format | `src/utils/format.js` |
| F8 Chart | §13 | chart | `src/components/chart.js` |
| F9 Ilustrasi | §2.5, §7 | dashboard | `src/utils/wmo.js`, `public/assets/weather/*` |
| F10 Peta (P2) | §15 | map | `src/components/map.js` |
| F11 LocalStorage | §16, §14 | storage | `src/core/storage.js` |
| F12 UI states | §17 | states | `src/components/states.js` |
| F13 AQI | §11 | aqi | `src/components/aqi.js`, `src/utils/aqi.js` |
| F14 Hero kabut | §11A.1 | hazeHero | `src/components/hazeHero.js`, `src/utils/healthAdvisory.js`, `src/utils/exposure.js` |
| F15 Polutan | §11A.2 | pollutantPanel | `src/components/pollutantPanel.js`, `src/utils/pollutants.js` |
| F16 Tren AQI | §11A.3 | airTrend | `src/components/airTrend.js`, `src/utils/airChartGeometry.js`, `src/utils/bestAirWindow.js` |
| F17 Angin & asap | §11A.4 | windDial | `src/components/windDial.js`, `src/utils/compass.js` |
| F18 Preset & leaderboard | §11A.5 | locationExplorer | `src/components/locationExplorer.js`, `src/utils/airRanking.js` |

Warna baru hanya token `--air-*` di §11A.1; nilai lain wajib berasal dari token §2.1. Bila butuh nuansa (hover/disabled), gunakan opasitas atau campuran dengan `--cream`, bukan hex baru.

---

## 22. Catatan Implementasi 1 Hari

| Milestone | Bagian UI-SPEC yang dieksekusi | Estimasi |
|---|---|---|
| M1 | §2 token, §4 grid, §6 navbar dasar | 1,25 j |
| M2 | tidak ada UI (kecuali status strip §6) | 1,50 j |
| M3 | §7 hero, §4 layout, §5 wireframe | 1,00 j |
| M4 | §8 hourly, §9 weekly | 1,25 j |
| M5 | §12 pencarian + sheet mobile | 0,75 j |
| M6 | §10 metrik, §11 AQI | 1,25 j |
| M7 | §13 chart, §14 favorit | 0,75 j |
| M8 | §16 toggle, §14 state tersimpan | 0,50 j |
| M9 | §17 states, §18 interaksi, §19 a11y, §15 peta (P2) | 0,60 j |
| M10 | §17.6 demo/stale, audit kontras, build | 0,40 j |

**Pemotongan bila waktu mepet** (mengikuti SPEC §10.1):
1. §15 peta → panel pesan "Peta tidak tersedia".
2. Aset 3D final → placeholder SVG (gaya tetap konsisten).
3. §13 chart → fallback tabel ringkas.
4. Detail AQI lanjutan (sub-indeks/polutan dominan) → angka + kategori + PM tetap.
5. Polish motion → sisakan fokus & pressed state.

**Yang tidak boleh disederhanakan:** border 3 px + hard shadow pada hero dan kartu utama, label "US AQI", badge kategori dengan teks (bukan warna saja), kontras minimal, target sentuh 44 px, dan seluruh state loading/error/empty.

**Definition of Done visual:**
- Tampil konsisten di 360, 768, 1280 px tanpa scroll horizontal.
- Tidak ada kartu seragam: hero, hourly, daily, metrik, AQI, dan favorit punya bentuk/proporsi berbeda.
- Semua warna berasal dari token; tidak ada glassmorphism/gradient dekoratif.
- Seluruh AC visual di SPEC §9 (AC-01…AC-28) dapat diverifikasi dari layar.
