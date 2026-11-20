/**
 * Konversi derajat angin menjadi mata angin 8 arah (key kamus + singkatan).
 * Arah angin meteorologis adalah arah DARI mana angin bertiup; asap bergerak
 * ke arah berlawanan (downwind).
 */

const DIRECTIONS = Object.freeze([
  { key: "wind.dir.n", abbr: "N" },
  { key: "wind.dir.ne", abbr: "NE" },
  { key: "wind.dir.e", abbr: "E" },
  { key: "wind.dir.se", abbr: "SE" },
  { key: "wind.dir.s", abbr: "S" },
  { key: "wind.dir.sw", abbr: "SW" },
  { key: "wind.dir.w", abbr: "W" },
  { key: "wind.dir.nw", abbr: "NW" },
]);

export function normalizeDegrees(degrees) {
  if (typeof degrees !== "number" || !Number.isFinite(degrees)) return null;
  return ((degrees % 360) + 360) % 360;
}

/**
 * @param {number|null|undefined} degrees
 * @returns {{ key: string, abbr: string, degrees: number }|null}
 */
export function getCompassDirection(degrees) {
  const normalized = normalizeDegrees(degrees);
  if (normalized === null) return null;
  const index = Math.round(normalized / 45) % DIRECTIONS.length;
  return { ...DIRECTIONS[index], degrees: Math.round(normalized) };
}

/** Arah pergerakan asap: berlawanan dengan arah datangnya angin. */
export function getDownwindDirection(degrees) {
  const normalized = normalizeDegrees(degrees);
  if (normalized === null) return null;
  return getCompassDirection(normalized + 180);
}
