/**
 * Perhitungan posisi matahari dari string waktu lokal Open-Meteo (fungsi murni).
 * Dipakai untuk busur matahari dan varian ikon malam pada strip per jam.
 */

import { toMinutes } from "./format.js";

/**
 * @param {string|null} timestamp waktu lokal "YYYY-MM-DDTHH:mm"
 * @param {string|null} sunrise
 * @param {string|null} sunset
 * @returns {{ state: "day"|"night"|"unknown", progress: number|null, dayLengthMinutes: number|null }}
 */
export function getSunProgress(timestamp, sunrise, sunset) {
  const now = toMinutes(timestamp);
  const rise = toMinutes(sunrise);
  const set = toMinutes(sunset);

  if (now === null || rise === null || set === null || set <= rise) {
    return { state: "unknown", progress: null, dayLengthMinutes: set !== null && rise !== null && set > rise ? set - rise : null };
  }

  const dayLengthMinutes = set - rise;

  if (now < rise || now > set) {
    return { state: "night", progress: now > set ? 1 : 0, dayLengthMinutes };
  }

  return {
    state: "day",
    progress: Math.min(1, Math.max(0, (now - rise) / dayLengthMinutes)),
    dayLengthMinutes,
  };
}

/**
 * Apakah sebuah jam berada di luar rentang siang hari ini.
 * `null` bila data matahari tidak lengkap (pemanggil memilih default).
 */
export function isTimeNight(time, sunrise, sunset) {
  const minutes = toMinutes(time);
  const rise = toMinutes(sunrise);
  const set = toMinutes(sunset);
  if (minutes === null || rise === null || set === null || set <= rise) return null;
  return minutes < rise || minutes > set;
}

export function formatDayLength(minutes) {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes < 0) return null;
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return { hours, minutes: rest };
}
