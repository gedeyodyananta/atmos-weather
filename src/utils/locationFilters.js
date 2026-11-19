/**
 * Penyaringan & pengurutan daftar lokasi tersimpan (fungsi murni).
 *
 * `filterLocations()` tidak menyentuh DOM, tidak melakukan fetch, dan tidak
 * mengubah array masukan. Semua kombinasi filter + query + sort dijalankan
 * dalam satu lintasan sehingga bisa dipakai bersama tanpa saling menimpa.
 */

export const LOCATION_SCOPE_ALL = "all";
export const LOCATION_SCOPE_FAVORITES = "favorites";

export const LOCATION_SORT_OPTIONS = Object.freeze([
  { value: "name-asc", label: "Nama A–Z" },
  { value: "temperature-asc", label: "Suhu terdingin" },
  { value: "temperature-desc", label: "Suhu terpanas" },
  { value: "aqi-asc", label: "AQI terbaik" },
]);

const collator = new Intl.Collator("id", { sensitivity: "base" });

function text(value) {
  return typeof value === "string" ? value : "";
}

function numeric(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeQuery(query) {
  return text(query).trim().toLocaleLowerCase("id");
}

function matchesQuery(location, needle) {
  if (!needle) return true;
  const haystack = [location.name, location.admin1, location.country, location.timezone]
    .map(text)
    .join(" ")
    .toLocaleLowerCase("id");
  return haystack.includes(needle);
}

function matchesScope(location, scope) {
  if (!scope || scope === LOCATION_SCOPE_ALL) return true;
  if (scope === LOCATION_SCOPE_FAVORITES) return location.isFavorite === true;

  const separator = scope.indexOf(":");
  if (separator === -1) return true;

  const kind = scope.slice(0, separator);
  const value = scope.slice(separator + 1);
  if (kind === "country") return text(location.country) === value;
  if (kind === "timezone") return text(location.timezone) === value;
  return true;
}

function compareName(a, b) {
  return (
    collator.compare(text(a.name), text(b.name)) ||
    collator.compare(text(a.country), text(b.country))
  );
}

/** Nilai `null` selalu di belakang agar data yang belum termuat tidak menyesatkan. */
function compareNullable(a, b, direction) {
  const left = numeric(a);
  const right = numeric(b);
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return direction * (left - right);
}

export function sortLocations(locations, sort = "name-asc") {
  const copy = [...locations];

  switch (sort) {
    case "temperature-asc":
      return copy.sort(
        (a, b) => compareNullable(a.temperature, b.temperature, 1) || compareName(a, b)
      );
    case "temperature-desc":
      return copy.sort(
        (a, b) => compareNullable(a.temperature, b.temperature, -1) || compareName(a, b)
      );
    case "aqi-asc":
      return copy.sort((a, b) => compareNullable(a.aqi, b.aqi, 1) || compareName(a, b));
    case "name-asc":
    default:
      return copy.sort(compareName);
  }
}

/**
 * @param {Array<object>} locations
 * @param {{ query?: string, scope?: string, sort?: string }} [options]
 * @returns {Array<object>} array baru berisi lokasi yang lolos filter, terurut
 */
export function filterLocations(locations, options = {}) {
  if (!Array.isArray(locations)) return [];

  const { query = "", scope = LOCATION_SCOPE_ALL, sort = "name-asc" } = options;
  const needle = normalizeQuery(query);

  const filtered = locations.filter(
    (location) =>
      location && typeof location === "object" && matchesScope(location, scope) && matchesQuery(location, needle)
  );

  return sortLocations(filtered, sort);
}

/**
 * Opsi filter turunan dari daftar lokasi: Negara & Zona Waktu (unik, terurut).
 * Nilai `timezone: "auto"` tidak dijadikan opsi karena bukan zona nyata.
 */
export function getFilterOptions(locations) {
  const countries = new Set();
  const timezones = new Set();

  for (const location of Array.isArray(locations) ? locations : []) {
    if (!location) continue;
    const country = text(location.country).trim();
    const timezone = text(location.timezone).trim();
    if (country) countries.add(country);
    if (timezone && timezone !== "auto") timezones.add(timezone);
  }

  const toOptions = (values, prefix) =>
    [...values]
      .sort((a, b) => collator.compare(a, b))
      .map((value) => ({ value: `${prefix}:${value}`, label: value }));

  return {
    countries: toOptions(countries, "country"),
    timezones: toOptions(timezones, "timezone"),
  };
}
