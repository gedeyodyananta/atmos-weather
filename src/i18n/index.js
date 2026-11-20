/**
 * Lapisan bahasa aplikasi (ID default, EN opsional).
 *
 * `setLocale()` dipanggil sekali di bootstrap dan setiap perubahan state,
 * sebelum komponen merender. Semua modul memakai `t()` supaya tidak ada teks
 * UI yang tersebar sebagai literal di komponen.
 */

import { en } from "./en.js";
import { id } from "./id.js";

export const DEFAULT_LOCALE = "id";
export const LOCALES = Object.freeze(["id", "en"]);

export const LOCALE_OPTIONS = Object.freeze([
  { value: "id", labelKey: "lang.id", nameKey: "lang.name.id" },
  { value: "en", labelKey: "lang.en", nameKey: "lang.name.en" },
]);

const DICTIONARIES = Object.freeze({ id, en });

let currentLocale = DEFAULT_LOCALE;

export function isLocale(value) {
  return typeof value === "string" && LOCALES.includes(value);
}

/** Fallback ke `id` untuk nilai tak dikenal (data localStorage rusak). */
export function normalizeLocale(value) {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function setLocale(value) {
  currentLocale = normalizeLocale(value);
  return currentLocale;
}

export function getLocale() {
  return currentLocale;
}

/** Tag BCP 47 untuk `Intl` (tanggal & angka). */
export function getLocaleTag() {
  return currentLocale === "en" ? "en-GB" : "id-ID";
}

function interpolate(template, variables) {
  if (!variables) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : match
  );
}

/**
 * @param {string} key
 * @param {Record<string, unknown>} [variables]
 * @returns {string} string terlokalisasi; key mentah bila tidak ditemukan
 */
export function t(key, variables) {
  const dictionary = DICTIONARIES[currentLocale] ?? DICTIONARIES[DEFAULT_LOCALE];
  const template =
    dictionary[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key;
  return interpolate(template, variables);
}
