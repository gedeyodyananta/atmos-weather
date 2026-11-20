/**
 * Peringkat udara dari daftar lokasi tersimpan (fungsi murni).
 * Hanya lokasi dengan AQI numerik yang ikut dibandingkan.
 */

export function rankAirQuality(locations) {
  const list = Array.isArray(locations) ? locations : [];
  const ranked = list
    .filter(
      (location) =>
        location &&
        typeof location.aqi === "number" &&
        Number.isFinite(location.aqi) &&
        location.aqi >= 0
    )
    .slice()
    .sort((left, right) => {
      if (left.aqi !== right.aqi) return left.aqi - right.aqi;
      return String(left.name ?? "").localeCompare(String(right.name ?? ""));
    });

  return {
    ranked,
    best: ranked[0] ?? null,
    worst: ranked.length > 0 ? ranked[ranked.length - 1] : null,
  };
}
