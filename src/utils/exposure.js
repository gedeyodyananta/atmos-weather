/**
 * Estimasi paparan PM2.5 harian setara batang rokok.
 * Rumus yang dipakai UI: PM2.5 ÷ 22, dibulatkan 1 desimal.
 */

export const CIGARETTES_PER_PM25_UNIT = 22;

/**
 * @param {number|null|undefined} pm25 konsentrasi PM2.5 (µg/m³)
 * @returns {number|null} batang rokok per hari, atau null bila data tidak valid
 */
export function getCigaretteEquivalent(pm25) {
  if (typeof pm25 !== "number" || !Number.isFinite(pm25) || pm25 < 0) return null;
  return Math.round((pm25 / CIGARETTES_PER_PM25_UNIT) * 10) / 10;
}
