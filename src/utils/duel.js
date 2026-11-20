/**
 * Perbandingan dua kota untuk Battle Mode (fungsi murni).
 * Hanya metrik yang tersedia di kedua sisi yang dihitung sebagai ronde.
 */

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
const EPSILON = 1e-9;

function visibilityKm(fighter) {
  const meters = fighter?.weather?.current?.visibility;
  if (!isNumber(meters)) return null;
  return Math.round((meters / 1000) * 10) / 10;
}

export const DUEL_METRICS = Object.freeze([
  Object.freeze({
    key: "aqi",
    labelKey: "battle.metric.aqi",
    unit: "US AQI",
    lowerIsBetter: true,
    read: (fighter) => fighter?.airQuality?.aqi,
  }),
  Object.freeze({
    key: "pm25",
    labelKey: "battle.metric.pm25",
    unit: "µg/m³",
    lowerIsBetter: true,
    read: (fighter) => fighter?.airQuality?.pm25,
  }),
  Object.freeze({
    key: "pm10",
    labelKey: "battle.metric.pm10",
    unit: "µg/m³",
    lowerIsBetter: true,
    read: (fighter) => fighter?.airQuality?.pm10,
  }),
  Object.freeze({
    key: "o3",
    labelKey: "battle.metric.o3",
    unit: "µg/m³",
    lowerIsBetter: true,
    read: (fighter) => fighter?.airQuality?.o3,
  }),
  Object.freeze({
    key: "visibility",
    labelKey: "battle.metric.visibility",
    unit: "km",
    lowerIsBetter: false,
    read: visibilityKm,
  }),
]);

function winnerFor(left, right, lowerIsBetter) {
  if (Math.abs(left - right) < EPSILON) return "tie";
  const leftWins = lowerIsBetter ? left < right : left > right;
  return leftWins ? "a" : "b";
}

/**
 * @param {{location: object, weather?: object, airQuality?: object}} left
 * @param {{location: object, weather?: object, airQuality?: object}} right
 */
export function compareFighters(left, right) {
  const rows = DUEL_METRICS.map((metric) => {
    const a = metric.read(left);
    const b = metric.read(right);
    const available = isNumber(a) && isNumber(b);
    return {
      key: metric.key,
      labelKey: metric.labelKey,
      unit: metric.unit,
      a: available ? a : null,
      b: available ? b : null,
      winner: available ? winnerFor(a, b, metric.lowerIsBetter) : null,
    };
  });

  const score = { a: 0, b: 0, ties: 0, compared: 0 };
  for (const row of rows) {
    if (!row.winner) continue;
    score.compared += 1;
    if (row.winner === "a") score.a += 1;
    else if (row.winner === "b") score.b += 1;
    else score.ties += 1;
  }

  let winner = "none";
  if (score.compared > 0) {
    if (score.a === score.b) winner = "tie";
    else winner = score.a > score.b ? "a" : "b";
  }

  return { rows, score, winner };
}

function coordinateKey(location) {
  if (!location || !isNumber(location.latitude) || !isNumber(location.longitude)) return null;
  return `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
}

/**
 * Gabungkan lokasi aktif, tersimpan, dan preset menjadi kandidat unik.
 * @returns {Array<object>}
 */
export function buildBattleCandidates({ active = null, saved = [], presets = [] } = {}) {
  const candidates = [];
  const seen = new Set();

  for (const location of [active, ...saved, ...presets]) {
    if (!location || typeof location !== "object") continue;
    if (!coordinateKey(location)) continue;

    const id = typeof location.id === "string" && location.id ? location.id : coordinateKey(location);
    const key = location.id ?? coordinateKey(location);
    if (seen.has(key) || seen.has(coordinateKey(location))) continue;

    seen.add(key);
    seen.add(coordinateKey(location));
    candidates.push({ ...location, id });
  }

  return candidates;
}

/** Pilih lawan pertama yang bukan kota utama. */
export function pickOpponent(candidates, primaryId) {
  return candidates.find((location) => location.id !== primaryId) ?? null;
}
