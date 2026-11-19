import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MAX_SAVED_LOCATIONS,
  MAX_STORAGE_VALUE_LENGTH,
  STORAGE_KEYS,
} from "../config/constants.js";
import { createInitialState } from "./store.js";
import {
  normalizeUnit,
  readLastLocation,
  readPreferences,
  readSavedLocations,
  validateLocationData,
  writePreferences,
  writeSavedLocations,
} from "./storage.js";

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  };
}

function makeLocation(index) {
  return {
    id: `loc-${index}`,
    name: `Kota ${index}`,
    admin1: "Provinsi",
    country: "Indonesia",
    latitude: -6.9 + index / 1000,
    longitude: 107.6 + index / 1000,
    timezone: "Asia/Jakarta",
    isFavorite: index % 2 === 0,
  };
}

let storage;

beforeEach(() => {
  storage = createMemoryStorage();
  globalThis.localStorage = storage;
});

afterEach(() => {
  delete globalThis.localStorage;
});

describe("validateLocationData", () => {
  const valid = {
    name: "Bandung",
    country: "Indonesia",
    latitude: -6.9175,
    longitude: 107.6191,
  };

  it("menerima lokasi valid termasuk batas koordinat -90/90 dan -180/180", () => {
    expect(validateLocationData(valid)).toEqual({ valid: true, errors: [] });
    expect(validateLocationData({ ...valid, latitude: 90, longitude: 180 }).valid).toBe(true);
    expect(validateLocationData({ ...valid, latitude: -90, longitude: -180 }).valid).toBe(true);
  });

  it("menolak latitude di luar -90..90 dan longitude di luar -180..180", () => {
    expect(validateLocationData({ ...valid, latitude: 90.0001 })).toEqual({
      valid: false,
      errors: ["latitude"],
    });
    expect(validateLocationData({ ...valid, latitude: -91 })).toEqual({
      valid: false,
      errors: ["latitude"],
    });
    expect(validateLocationData({ ...valid, longitude: 180.5 })).toEqual({
      valid: false,
      errors: ["longitude"],
    });
    expect(validateLocationData({ ...valid, longitude: -181 })).toEqual({
      valid: false,
      errors: ["longitude"],
    });
  });

  it("menolak nama kota kosong, koordinat non-angka, dan nilai bukan objek", () => {
    expect(validateLocationData({ ...valid, name: "   " })).toEqual({
      valid: false,
      errors: ["name"],
    });
    expect(validateLocationData({ ...valid, latitude: "lat" })).toEqual({
      valid: false,
      errors: ["latitude"],
    });
    expect(validateLocationData({ ...valid, latitude: Number.NaN }).valid).toBe(false);
    expect(validateLocationData(null)).toEqual({ valid: false, errors: ["location"] });
    expect(validateLocationData([valid])).toEqual({ valid: false, errors: ["location"] });
    expect(validateLocationData({ ...valid, name: "", country: null, latitude: 100, longitude: 200 })).toEqual({
      valid: false,
      errors: ["name", "country", "latitude", "longitude"],
    });
  });
});

describe("readSavedLocations", () => {
  it("membaca array valid dan menormalkan field opsional", () => {
    storage.setItem(
      STORAGE_KEYS.savedLocations,
      JSON.stringify([{ ...makeLocation(1), name: "  Bandung  ", timezone: "" }, makeLocation(2)])
    );

    const locations = readSavedLocations();
    expect(locations).toHaveLength(2);
    expect(locations[0].name).toBe("Bandung");
    expect(locations[0].timezone).toBe("auto");
    expect(locations[0].isFavorite).toBe(false);
    expect(locations[1].isFavorite).toBe(true);
  });

  it("mengembalikan array kosong dan menghapus key saat JSON rusak atau bukan array", () => {
    storage.setItem(STORAGE_KEYS.savedLocations, "{bukan json");
    expect(readSavedLocations()).toEqual([]);
    expect(storage.getItem(STORAGE_KEYS.savedLocations)).toBeNull();

    storage.setItem(STORAGE_KEYS.savedLocations, JSON.stringify({ name: "Bandung" }));
    expect(readSavedLocations()).toEqual([]);
    expect(storage.getItem(STORAGE_KEYS.savedLocations)).toBeNull();

    storage.setItem(STORAGE_KEYS.savedLocations, JSON.stringify("teks"));
    expect(readSavedLocations()).toEqual([]);

    expect(readSavedLocations()).toEqual([]);
  });

  it("membatasi maksimal 20 lokasi tersimpan", () => {
    expect(MAX_SAVED_LOCATIONS).toBe(20);
    const many = Array.from({ length: 25 }, (_, index) => makeLocation(index));
    storage.setItem(STORAGE_KEYS.savedLocations, JSON.stringify(many));

    const locations = readSavedLocations();
    expect(locations).toHaveLength(20);
    expect(locations.at(-1).id).toBe("loc-19");
  });

  it("melewati entri tidak valid dan membuang duplikat id", () => {
    storage.setItem(
      STORAGE_KEYS.savedLocations,
      JSON.stringify([
        makeLocation(1),
        makeLocation(1),
        { ...makeLocation(2), latitude: 120 },
        null,
        makeLocation(3),
      ])
    );

    expect(readSavedLocations().map((location) => location.id)).toEqual(["loc-1", "loc-3"]);
  });
});

describe("readPreferences — satuan suhu", () => {
  it("mengembalikan default Celsius saat key belum ada", () => {
    expect(readPreferences()).toEqual({ unit: "c" });
  });

  it("membaca satuan valid c/f tanpa membedakan huruf besar", () => {
    storage.setItem(STORAGE_KEYS.preferences, JSON.stringify({ unit: "f", updatedAt: "2026-01-01T00:00:00Z" }));
    expect(readPreferences()).toEqual({ unit: "f" });

    storage.setItem(STORAGE_KEYS.preferences, JSON.stringify({ unit: "C" }));
    expect(readPreferences()).toEqual({ unit: "c" });
  });

  it("fallback ke Celsius dan menghapus key saat JSON rusak atau tipe salah", () => {
    storage.setItem(STORAGE_KEYS.preferences, "{rusak");
    expect(readPreferences()).toEqual({ unit: "c" });
    expect(storage.getItem(STORAGE_KEYS.preferences)).toBeNull();

    for (const payload of ["[]", "null", '"f"', "42"]) {
      storage.setItem(STORAGE_KEYS.preferences, payload);
      expect(readPreferences()).toEqual({ unit: "c" });
      expect(storage.getItem(STORAGE_KEYS.preferences)).toBeNull();
    }
  });

  it("fallback ke Celsius untuk nilai satuan selain c/f", () => {
    for (const unit of ["k", "kelvin", "", 1, null]) {
      storage.setItem(STORAGE_KEYS.preferences, JSON.stringify({ unit }));
      expect(readPreferences()).toEqual({ unit: "c" });
      expect(storage.getItem(STORAGE_KEYS.preferences)).toBeNull();
    }
  });

  it("normalizeUnit memetakan nilai tak dikenal ke c", () => {
    expect(normalizeUnit("F")).toBe("f");
    expect(normalizeUnit(" f ")).toBe("f");
    expect(normalizeUnit("k")).toBe("c");
    expect(normalizeUnit(undefined)).toBe("c");
  });
});

describe("persistensi round-trip", () => {
  it("menyimpan satuan Fahrenheit lalu membacanya kembali", () => {
    expect(writePreferences({ unit: "f" })).toBe(true);
    expect(readPreferences()).toEqual({ unit: "f" });

    expect(writePreferences({ unit: "tidak-valid" })).toBe(true);
    expect(readPreferences()).toEqual({ unit: "c" });
  });

  it("createInitialState memakai satuan dan lokasi terakhir yang tersimpan", () => {
    writePreferences({ unit: "f" });
    storage.setItem(
      STORAGE_KEYS.lastLocation,
      JSON.stringify({ ...makeLocation(7), id: "geo:7", name: "Kota Denpasar" })
    );

    const state = createInitialState();
    expect(state.unit).toBe("f");
    expect(state.preferences).toEqual({ unit: "f" });
    expect(state.location.name).toBe("Kota Denpasar");
    expect(state.isSampleLocation).toBe(false);
  });

  it("menolak payload JSON valid yang melebihi batas ukuran", () => {
    // Sebelum patch, payload raksasa ini di-parse penuh dan tetap dipakai.
    const oversizedLocations = JSON.stringify(
      Array.from({ length: 4000 }, (_, index) => makeLocation(index))
    );
    expect(oversizedLocations.length).toBeGreaterThan(MAX_STORAGE_VALUE_LENGTH);

    storage.setItem(STORAGE_KEYS.savedLocations, oversizedLocations);
    expect(readSavedLocations()).toEqual([]);
    expect(storage.getItem(STORAGE_KEYS.savedLocations)).toBeNull();

    const oversizedPreferences = JSON.stringify({
      unit: "f",
      padding: "a".repeat(MAX_STORAGE_VALUE_LENGTH),
    });
    storage.setItem(STORAGE_KEYS.preferences, oversizedPreferences);
    expect(readPreferences()).toEqual({ unit: "c" });
    expect(storage.getItem(STORAGE_KEYS.preferences)).toBeNull();

    const oversizedLast = JSON.stringify({
      ...makeLocation(1),
      padding: "a".repeat(MAX_STORAGE_VALUE_LENGTH),
    });
    storage.setItem(STORAGE_KEYS.lastLocation, oversizedLast);
    expect(readLastLocation()).toBeNull();
    expect(storage.getItem(STORAGE_KEYS.lastLocation)).toBeNull();
  });

  it("writeSavedLocations membuang duplikat id dan membatasi 20 entri", () => {
    const entries = [
      makeLocation(1),
      makeLocation(1),
      makeLocation(2),
      ...Array.from({ length: 25 }, (_, index) => makeLocation(index + 10)),
    ];

    expect(writeSavedLocations(entries)).toBe(true);
    const stored = readSavedLocations();
    expect(stored).toHaveLength(20);
    expect(stored[0].id).toBe("loc-1");
    expect(stored[1].id).toBe("loc-2");
    expect(new Set(stored.map((location) => location.id)).size).toBe(20);
  });
});
