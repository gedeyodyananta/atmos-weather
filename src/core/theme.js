/**
 * Tema visual disimpan terpisah dari satuan/bahasa supaya preferensi lama
 * tetap kompatibel. Hanya dua nilai yang dikenal; nilai lain kembali ke paper.
 */

import { STORAGE_KEYS } from "../config/constants.js";
import { safeRead, safeWrite } from "./storage.js";

export const THEMES = Object.freeze({
  paper: "paper",
  blackout: "blackout",
});

export function normalizeTheme(value) {
  return value === THEMES.blackout ? THEMES.blackout : THEMES.paper;
}

export function readTheme() {
  return normalizeTheme(safeRead(STORAGE_KEYS.theme));
}

export function writeTheme(value) {
  return safeWrite(STORAGE_KEYS.theme, normalizeTheme(value));
}
