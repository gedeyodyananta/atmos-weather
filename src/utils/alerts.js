/**
 * Peringatan cuaca yang diturunkan dari data nyata (fungsi murni).
 * Tidak ada angka atau klaim tambahan: setiap peringatan hanya muncul bila
 * ambangnya benar-benar terlampaui oleh respons Open-Meteo.
 */

const LOOKAHEAD_HOURS = 6;
const RAIN_THRESHOLD = 60;
const UV_THRESHOLD = 8;
const WIND_THRESHOLD = 35;
const GUST_THRESHOLD = 50;
const AQI_THRESHOLD = 101;
const SWING_THRESHOLD = 12;
const MAX_ALERTS = 6;

const numeric = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);

function stormAhead(hours) {
  return hours.some((hour) => {
    const code = numeric(hour.weatherCode);
    return code !== null && code >= 95;
  });
}

/**
 * @param {{ hourly?: Array<object>, daily?: Array<object>, current?: object }|null} weather
 * @param {{ aqi?: number|null }|null} airQuality
 * @returns {Array<{ key: string, tone: string, params: Record<string, number> }>}
 */
export function buildWeatherAlerts(weather, airQuality) {
  const hours = (weather?.hourly ?? []).slice(0, LOOKAHEAD_HOURS);
  const current = weather?.current ?? null;
  const today = weather?.daily?.[0] ?? null;
  const alerts = [];

  const probabilities = hours
    .map((hour) => numeric(hour.precipitationProbability))
    .filter((value) => value !== null);
  const maxRain = probabilities.length > 0 ? Math.max(...probabilities) : null;
  if (maxRain !== null && maxRain >= RAIN_THRESHOLD) {
    alerts.push({
      key: "alerts.rain",
      tone: "rain",
      params: { probability: Math.round(maxRain), hours: LOOKAHEAD_HOURS },
    });
  }

  if (stormAhead(hours)) {
    alerts.push({ key: "alerts.storm", tone: "storm", params: {} });
  }

  const uv = numeric(current?.uvIndex);
  if (uv !== null && uv >= UV_THRESHOLD) {
    alerts.push({ key: "alerts.uv", tone: "uv", params: { value: Math.round(uv) } });
  }

  const wind = Math.max(numeric(current?.windSpeed) ?? 0, numeric(current?.windGusts) ?? 0);
  if (wind >= WIND_THRESHOLD || (numeric(current?.windGusts) ?? 0) >= GUST_THRESHOLD) {
    alerts.push({ key: "alerts.wind", tone: "wind", params: { speed: Math.round(wind) } });
  }

  const aqi = numeric(airQuality?.aqi);
  if (aqi !== null && aqi >= AQI_THRESHOLD) {
    alerts.push({ key: "alerts.aqi", tone: "aqi", params: { value: Math.round(aqi) } });
  }

  const max = numeric(today?.temperatureMax);
  const min = numeric(today?.temperatureMin);
  if (max !== null && min !== null && max - min >= SWING_THRESHOLD) {
    alerts.push({ key: "alerts.swing", tone: "swing", params: { min, max } });
  }

  return alerts.slice(0, MAX_ALERTS);
}
