# ATMOS — Weather & Haze Explorer

[English](README.md) | [Bahasa Indonesia](README.id.md)

> **Interface language:** The ATMOS user interface is localized in Indonesian by default, with an English option. Indonesian is the primary language for air-quality and haze (karhutla) monitoring. This document is the English README; the Indonesian version is in [`README.id.md`](README.id.md).

ATMOS is a browser-based weather and air-quality dashboard with a Neo-Brutalist/technical visual style. It combines current conditions, hourly and seven-day forecasts, US AQI, wildfire-haze indicators, pollutant breakdowns, wind and sun data, and saved-location tools in one responsive page.

The application is entirely client-side. It has no backend, database, login system, API key, or production dependency. Weather, geocoding, and air-quality data are fetched directly from public Open-Meteo APIs.

---

## Project Overview & Purpose

ATMOS was built to answer two related questions quickly:

1. **What is the weather like here now, and what is coming next?**
2. **Is the air safe enough for normal outdoor activity, especially during haze or wildfire (karhutla) episodes?**

The UI emphasizes dense, scannable information rather than a generic card dashboard. Every value is derived from a live API response or from a clearly identified estimate; the app does not ship static weather data or pretend that unavailable data is zero.

The interface supports:

- Indonesian (default) and English UI copy.
- Celsius/Fahrenheit display units.
- Desktop, tablet, and mobile layouts.
- Local-only persistence for preferences and saved locations.

The application is a static single-page site. There is no server-side rendering, routing layer, account system, or synchronization service.

---

## Origin & Context

ATMOS — Weather Explorer was built during a one-day vibe coding sprint at **CHAT (Creative Hub for App Talent)**, a training programme organised by the [Ministry of Creative Economy (Ekraf) of the Republic of Indonesia](https://ekraf.go.id/).

The sprint was designed as a rapid end-to-end product exercise: turn an initial brief into a working, demonstrable web application within a single day. In this context, vibe coding meant using AI-assisted iteration to explore the product direction quickly while keeping the implementation grounded in explicit requirements, real API data, responsive behaviour, and repeatable checks. The result is a functional prototype, not a claim of production readiness or an official government product.

The Indonesian context shaped the scope. Haze and wildfire (karhutla) episodes make air quality a practical daily concern, so ATMOS brings weather and air-quality signals together in one interface instead of treating them as separate dashboards. The project also served as an exercise in clear data attribution, honest handling of unavailable values, and bilingual Indonesian/English communication under a tight delivery window.

---

## Key Features

### Weather dashboard

- **Current-weather hero:** location name, administrative region/country, local date and time, large temperature, WMO condition label, feels-like temperature, UV/wind/sunset/pressure chips, and humidity/wind/UV/pressure metrics.
- **Weather-aware hero styling:** the hero tone follows the WMO condition category and day/night state (clear, cloud, rain, storm, snow, fog, or fallback). The transition between day and night changes the local SVG illustration.
- **Local SVG weather illustrations:** sun, moon, clouds, rain, storms, snow, and fog are drawn in code. No external icon, image, or CDN request is required.
- **Hourly forecast:** up to 24 entries beginning at the current hour, each with local time, condition icon, temperature, precipitation probability, and wind speed.
- **Seven-day forecast:** daily condition, a min–max temperature range bar, precipitation probability, maximum UV, and a “today” marker.
- **24-hour temperature chart:** native SVG with a temperature line, a dashed feels-like line, and precipitation-probability bars. Temperature values follow the selected °C/°F unit.
- **Atmosphere panel:** humidity, surface pressure, visibility, UV index (with the current day’s maximum UV when available), dew point, and cloud cover.
- **Sun arc:** current solar position between sunrise and sunset, day/night phase, sunrise, sunset, and day length.
- **Wind compass:** a 16-point visual dial, an eight-point localized direction with degrees (for example “Southeast · 135°”), wind speed, gusts, and the estimated **downwind direction for smoke movement**.
- **Condition/alert ticker:** generated only from actual weather/AQI data. It covers rain probability in the next six hours, storms, UV, strong wind/gusts, AQI, and daily temperature swing. If there is no alert, it shows a short live summary instead.
- **Refresh and data status:** a status strip shows the last update time and cache state; the refresh button requests fresh forecast and air-quality data.

### Air quality and haze monitoring

- **Haze status hero:** a prominent card whose background changes with the US AQI category (green, yellow, orange, red, or dark purple). It shows the current AQI category, PM2.5, and practical guidance.
- **Mask and health guidance:** maps the AQI level to “No Mask Needed”, “Medical Mask”, or “N95/KF94 Required”, plus outdoor-activity guidance and a warning for sensitive groups.
- **Cigarette-exposure estimate:** displays an informational PM2.5 equivalent using `PM2.5 ÷ 22`, rounded to one decimal place. This is an estimate, not a medical diagnosis.
- **AQI panel:** US AQI value, localized category badge and description, and a segmented 0–300 position meter with a marker. Values above 300 are clamped to the end of the visual scale.
- **Pollutant and visibility bento:** six cards for PM2.5, PM10, carbon monoxide (CO), nitrogen dioxide (NO2), ozone (O3), and visibility. Each card shows the value, a status label, a progress bar against a fixed WHO reference limit, and the limit itself.
- **Fixed reference limits used by the UI:**
  - PM2.5: 15 µg/m³
  - PM10: 45 µg/m³
  - CO: 4 mg/m³ (raw API value in µg/m³ is converted for display)
  - NO2: 25 µg/m³
  - O3: 100 µg/m³
  - Visibility: 10 km (higher is better)
- **Pollutant status:** values at or below 50% of a limit are marked safe; values above 50% and up to 100% are marked near the limit; values above 100% are marked over the limit. Visibility uses the reverse comparison because greater visibility is better.
- **24-hour air-quality trend:** native SVG with AQI bars coloured by category, a PM2.5 line on a separate right-hand scale, local-hour labels, an AQI peak callout, and a shaded **best air window**.
- **Best air window:** the three consecutive hours with the lowest average AQI. The badge shows the start and end hours in `HH.mm – HH.mm` format.
- **Isolated AQI failure:** forecast and air-quality requests run independently. If air-quality data fails or is unavailable, the weather dashboard remains usable and the AQI-related panels expose their own state and retry action.

### Karhutla presets and air-quality comparison

- **Quick-add city chips:** Palangkaraya (Central Kalimantan), Pontianak (West Kalimantan), Pekanbaru (Riau), and Jambi. Selecting a chip adds or selects that location using the normal saved-location flow, without duplicating an existing location.
- **Air-quality leaderboard:** compares saved locations that have a numeric AQI and shows the cleanest and worst entries, each with its AQI and category. It appears once at least two saved locations have AQI values.

### Locations, preferences, and sharing

- **City search:** Open-Meteo geocoding with a minimum of 2 characters, a 350 ms debounce, at most 8 results, keyboard navigation (↑/↓/Enter/Escape), result metadata, empty state, and retry on error. Stale requests are aborted.
- **Device geolocation:** the “My location” button uses the browser Geolocation API. Coordinates are rounded to four decimal places and no reverse geocoding service is used.
- **Saved locations:** up to 20 locations, with active-location selection, favorite toggling, removal, and share controls. The saved list shows available temperature and AQI data.
- **Filtering and sorting:** filter by all locations, favorites, country, or time zone; sort by name, coldest temperature, warmest temperature, or best AQI. Filters and the search query can be combined.
- **Language switch:** Indonesian and English UI dictionaries, including labels, errors, dates, AQI categories, and share text. The selected language is persisted locally.
- **Temperature-unit switch:** °C/°F for all temperature displays, without re-fetching weather data. The selected unit is persisted locally.
- **WhatsApp sharing:** builds a `wa.me` link containing the selected location, current temperature, condition, and AQI. The action is disabled when required weather/AQI data is incomplete.
- **Loading, empty, and error states:** panels use skeletons or explicit messages, and retry actions are scoped to the affected data source where possible.
- **Local-first resilience:** invalid or oversized saved data is discarded safely instead of breaking the page.

### Responsive and accessible interface

- Mobile-first CSS with panel layouts that adapt at approximately 560 px, 640 px, 1024 px, and 1280 px.
- On wide screens, the location explorer becomes a sticky side rail; on smaller screens it follows the dashboard in a single-column flow.
- Hourly cards scroll horizontally inside their own strip, while the page itself is designed without deliberate horizontal overflow.
- Includes a skip link, visible focus styles, semantic headings, ARIA labels/live regions, `prefers-reduced-motion` handling, and keyboard support for search and controls.
- The test suite includes a DOM smoke test, but the project does **not** claim a formal WCAG audit or browser-based visual regression coverage.

---

## Tech Stack

| Area | Technology |
|---|---|
| Language | JavaScript (ES Modules), HTML5, CSS3 |
| UI | Native DOM APIs, native SVG, CSS custom properties; no UI framework |
| Build tool / dev server | Vite 8.3.8 |
| Tests | Vitest 5.1.1 |
| DOM test environment | linkedom 0.18.15 |
| Data | Public Open-Meteo REST APIs over `fetch` |
| Persistence | Browser `localStorage` |
| Fonts | Self-hosted Space Grotesk and Inter variable WOFF2 files |
| Production dependencies | None |

Vite and Vitest are development dependencies only. The production output is static HTML, CSS, JavaScript, and font files. Charts and weather illustrations are implemented with native SVG; no Chart.js, Leaflet, or other chart/map library is loaded.

### Version requirements

- Use a Node.js release supported by Vitest 5: **22.12+, 24+, or 26+**. Node.js 24 LTS is the verified environment. Vite 8 also accepts Node `20.19+`, but the test runner requires the stricter Vitest range.
- npm is used for dependency installation and scripts.
- A modern browser with ES modules, `fetch`, `AbortController`, `Intl`, and `localStorage` is required.

The repository was verified locally with Node.js **24.14.1** and npm **11.11.0**.

---

## Installation & Local Development

### 1. Enter the project directory

```bash
cd atmos
```

### 2. Install dependencies

```bash
npm ci
```

`npm ci` installs the exact dependency versions from `package-lock.json`. If the lockfile cannot be used in your environment, `npm install` is the fallback.

### 3. Start the development server

```bash
npm run dev
```

Open the URL printed by Vite. The default is usually `http://localhost:5173`.

No `.env` file, API key, database, or backend process is needed. The API endpoints are public and defined in `src/config/constants.js`.

### Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server with hot module replacement |
| `npm test` | Run the full Vitest suite once (`vitest run`) |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Serve the generated production build locally |

---

## Running Unit Tests (`npm test`)

```bash
npm test
```

The command runs Vitest once (`vitest run`). The current repository contains **18 test files and 108 passing tests**:

- `src/api/security.test.js` — API response validation, URL encoding, malformed responses, and error normalization.
- `src/core/storage.test.js` — location validation, preference parsing, corrupt/oversized localStorage payloads, deduplication, and the 20-location limit.
- `src/utils/airChartGeometry.test.js` — AQI/PM2.5 chart geometry, category bars, best-window markers, and missing values.
- `src/utils/airRanking.test.js` — cleanest/worst air-quality ranking and invalid AQI handling.
- `src/utils/alerts.test.js` — weather alert thresholds and alert-count limits.
- `src/utils/bestAirWindow.test.js` — lowest-average three-hour window selection.
- `src/utils/chartGeometry.test.js` — temperature chart paths, unit conversion, plot bounds, and rain bars.
- `src/utils/compass.test.js` — compass directions, degree normalization, and downwind smoke direction.
- `src/utils/exposure.test.js` — PM2.5-to-cigarette-equivalent calculation.
- `src/utils/geolocation.test.js` — browser geolocation success and error paths.
- `src/utils/healthAdvisory.test.js` — mask, activity, and sensitive-group guidance by AQI level.
- `src/utils/locationFilters.test.js` — search, scope filters, sorting, null handling, and filter-option derivation.
- `src/utils/locationName.test.js` — localized display name for device locations.
- `src/utils/pollutants.test.js` — WHO reference limits, CO/visibility conversion, status levels, and percentage clamping.
- `src/utils/sun.test.js` — solar progress, day/night detection, and day-length formatting.
- `src/utils/weatherShare.test.js` — share-data validation, message construction, and URL encoding.
- `src/utils/weatherTheme.test.js` — WMO-to-hero-tone mapping and day/night resolution.
- `src/app.smoke.test.js` — renders the full application in a linkedom virtual DOM using mocked API responses; it covers the weather and haze heroes, pollutants, trend chart, preset chips, the leaderboard empty state, language switching, unit switching, and persisted preferences.

The smoke test is not a browser visual test and does not prove layout correctness. There is currently no coverage-report script, end-to-end browser suite, or visual-regression suite.

To run Vitest in watch mode, use `npx vitest` directly.

---

## Production Build (`npm run build`)

```bash
npm run build
```

The build writes a static site to `dist/`:

- `dist/index.html`
- one hashed CSS bundle under `dist/assets/`
- one hashed JavaScript bundle under `dist/assets/`
- the self-hosted WOFF2 font files under `dist/assets/fonts/`

The current verified build completes successfully with Vite 8.3.8. Built asset filenames include content hashes, so they can be cached for a long time.

To serve and inspect the production build locally:

```bash
npm run preview
```

`dist/` is ignored by Git and must be generated as part of each deployment.

---

## Deployment Guide

ATMOS is a static single-page application. Any static hosting service can serve the contents of `dist/`; no application server, database, API key, or environment variable is required.

### Recommended steps

1. Install dependencies with `npm ci`.
2. Run the quality checks:

   ```bash
   npm test
   npm run build
   ```

3. Upload the **contents** of `dist/` as the site root. Do not upload `src/`, `node_modules/`, or development-only files.
4. Configure the host to serve `index.html` for the root path.

### Base-path requirement

The generated `index.html` references assets from an absolute root path such as `/assets/index-*.js` and `/assets/fonts/...`. This works when the site is deployed at a domain root (for example `https://example.com/`).

For a subpath deployment—such as a GitHub Pages project site at `https://example.com/<repository>/`—set Vite’s `base` option to that subpath before building. Because this repository does not include a `vite.config.js`, the simplest option is the Vite CLI flag through the npm script:

```bash
npm run build -- --base=/<repository>/
```

Use the actual repository path in place of `<repository>`.

### Hosting notes

- There is no client-side router, so no SPA rewrite/fallback rule is required for routes. A host may still redirect unknown paths to `index.html` if desired.
- The app can be hosted on any static provider, including Netlify, Vercel, Cloudflare Pages, GitHub Pages, or a conventional web server. These integrations are not preconfigured in the repository.
- No hosting configuration, security headers, CDN rules, or CI workflow is included. Configure HTTPS, content-security headers, and caching at the hosting provider if required.
- A sensible cache policy is long-lived caching for hashed files in `dist/assets/`, with `index.html` revalidated on each deployment.
- Keep the Open-Meteo attribution in the footer visible. No OpenStreetMap assets are currently part of the app.

---

## API & Data Attribution (Open-Meteo & OpenStreetMap)

### Open-Meteo endpoints used

| Purpose | Endpoint | Notes |
|---|---|---|
| Weather forecast | `https://api.open-meteo.com/v1/forecast` | Current conditions, hourly forecast, and seven-day daily forecast |
| City geocoding | `https://geocoding-api.open-meteo.com/v1/search` | Up to 8 results; language follows the active UI locale (`id` or `en`) |
| Air quality | `https://air-quality-api.open-meteo.com/v1/air-quality` | Current US AQI, PM2.5, PM10, CO, NO2, O3, and hourly AQI/PM2.5 for the trend |

Requests use:

- `timezone=auto` so timestamps follow the selected location’s time zone.
- Celsius and km/h for forecast values.
- `forecast_days=7` for the weather forecast and `forecast_days=2` for air quality (to cover a 24-hour trend across midnight).
- No API key, bearer token, SDK, or proxy.

### Data handling behavior

- API requests time out after **10 seconds** and use `AbortController`.
- Forecast responses are cached in memory for **10 minutes**; air-quality responses for **15 minutes**; geocoding searches for **10 minutes**.
- In-flight requests for the same rounded coordinate are shared to avoid duplicate calls.
- Forecast and air-quality loads run independently, so one source can fail without clearing the other.
- Responses are kept in memory only; they are not written to `localStorage`.
- Missing or invalid numeric fields are displayed as “—” rather than being replaced with zero.

### Attribution in the application

The footer displays **“Weather data: Open-Meteo (CC BY 4.0)”** in English and **“Data cuaca: Open-Meteo (CC BY 4.0)”** in Indonesian, with links to [open-meteo.com](https://open-meteo.com/) and the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/). Air-quality and geocoding data come from the same provider.

### OpenStreetMap status

**OpenStreetMap is not currently used by ATMOS.** The repository contains no map component, Leaflet dependency, tile request, map marker, or OpenStreetMap attribution. The application does not display a map.

If a map or OSM-derived layer is added in the future, the project must display “© OpenStreetMap contributors” and link to the [OpenStreetMap copyright page](https://www.openstreetmap.org/copyright), in addition to following the tile provider’s attribution and usage requirements.

---

## Project Structure

```text
atmos/
├─ index.html                  # Single-page HTML entry point
├─ public/
│  └─ assets/fonts/            # Self-hosted Space Grotesk and Inter WOFF2 files
├─ src/
│  ├─ main.js                  # Application bootstrap and store wiring
│  ├─ ui.js                    # Header, status strip, ticker, footer, toast
│  ├─ style.css                # Design tokens, components, grid, responsive CSS
│  ├─ api/                     # HTTP client and Open-Meteo response mapping
│  ├─ components/              # Weather, AQI, haze, location, search, and SVG views
│  ├─ config/                  # API endpoints, limits, cache TTLs, share template
│  ├─ core/                    # Store and safe localStorage helpers
│  ├─ i18n/                    # Indonesian/English dictionaries and t()
│  ├─ services/                # Forecast/AQI orchestration, cache, in-flight deduplication
│  └─ utils/                   # Pure calculations, formatting, filters, alerts, SVG geometry
├─ package.json
├─ package-lock.json
├─ README.md                   # English documentation (this file)
└─ README.id.md                # Indonesian documentation
```

No backend, serverless function, database, service worker, or test fixtures directory is present.

---

## Known Limitations

### Local browser storage only

Preferences and saved locations **only use `localStorage` in the current browser and origin**. There is no backend, account system, authentication, or synchronization between devices.

| Key | Contents | Behavior |
|---|---|---|
| `atmos.v1.preferences` | `{ unit: "c" \| "f", locale: "id" \| "en", updatedAt }` | Invalid units/locales fall back to Celsius/Indonesian |
| `atmos.v1.locations` | Saved locations and favorite flags | Maximum 20 entries; duplicate IDs are removed; invalid entries are skipped |
| `atmos.v1.lastLocation` | The last selected location | Restored on the next visit; invalid data is discarded |

Important consequences:

- Saved locations, favorites, the last location, unit, and language **do not sync** across browsers, devices, profiles, origins, or private windows.
- Clearing site data removes all locally saved preferences and locations.
- There is no login or user account, so anyone using the same browser profile can view the saved locations.
- If localStorage is unavailable, blocked, or full, writes fail safely and the app continues with defaults; preferences may not survive a reload.
- Stored JSON is size-limited to 256 KB. Corrupt or oversized values are removed rather than trusted.
- Selecting “My location” rounds coordinates to four decimals and stores them like any other location. Coordinates are sent directly to Open-Meteo for forecast and air-quality requests; no reverse-geocoding service is called.

### Data and functional limitations

- The application requires an internet connection and depends on Open-Meteo availability and rate limits.
- AQI or pollutant values can be missing for a location. The UI shows an unavailable/“—” state instead of inventing a value.
- The pollutant thresholds are fixed WHO reference limits, not a live regulatory index. The cigarette equivalent, mask suggestion, activity guidance, and sensitive-group warning are informational only and are not medical advice.
- AQI uses the **US AQI** scale; it is not the European AQI.
- The air-quality trend covers up to 24 hourly values returned by the API. The app does not store or query historical air-quality archives.
- The “best air window” is simply the lowest average AQI across three consecutive available hours; it is not a forecast guarantee.
- The app does not provide maps, wildfire hotspots, satellite imagery, smoke-plume modelling, or OpenStreetMap data.
- There are no push notifications, email alerts, weather history, radar animation, or marine/pollen data.
- WhatsApp sharing requires a location name, temperature, weather condition, and AQI. The share control is disabled until those values are available.
- The UI supports only Indonesian and English.
- When no valid last location exists, ATMOS starts with the sample location **Kuta Selatan, Bali**, labelled as a sample location.

### Runtime and testing limitations

- No offline mode, service worker, or installable PWA is implemented.
- No browser-based end-to-end or visual layout test suite is included. The smoke test runs in linkedom and verifies rendered DOM behavior, not pixel layout or real-browser compatibility.
- The app targets modern browsers and does not include polyfills.
