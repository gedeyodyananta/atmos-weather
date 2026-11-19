/**
 * State store tunggal (SPEC §5.3) + state awal aplikasi.
 * Satu objek state, satu daftar subscriber; `dispatch` dan `setState` setara.
 */

import { DEFAULT_LOCATION } from "../config/constants.js";
import { readLastLocation, readPreferences } from "./storage.js";

export function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();

  return {
    getState() {
      return state;
    },

    /**
     * @param {object|Function} patch objek partial atau updater (state) => partial
     */
    setState(patch) {
      const partial = typeof patch === "function" ? patch(state) : patch;
      if (!partial) return state;
      state = { ...state, ...partial };
      for (const listener of listeners) listener(state);
      return state;
    },

    /** Alias `setState` agar pemanggilan mengikuti istilah SPEC §5.3. */
    dispatch(patch) {
      return this.setState(patch);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * State awal: `lastLocation` valid → dipakai; jika tidak ada/rusak → lokasi
 * contoh Kuta Selatan dengan penanda `isSampleLocation` untuk label UI.
 */
export function createInitialState() {
  const lastLocation = readLastLocation();
  const location = lastLocation ?? { ...DEFAULT_LOCATION };
  const preferences = readPreferences();

  return {
    location,
    isSampleLocation: !lastLocation,
    weather: null,
    status: "idle",
    error: null,
    airQuality: null,
    airQualityStatus: "idle",
    airQualityError: null,
    unit: preferences.unit,
    preferences,
    favorites: [],
    search: { query: "", status: "idle", results: [], error: null },
    ui: { mapEnabled: false, lastUpdated: null },
  };
}
