import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../config/constants.js";
import { normalizeTheme, readTheme, writeTheme } from "./theme.js";

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
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

describe("tema Blackout", () => {
  it("default ke paper dan menormalkan nilai tak dikenal", () => {
    expect(readTheme()).toBe("paper");
    expect(normalizeTheme(undefined)).toBe("paper");
    expect(normalizeTheme("neon")).toBe("paper");
  });

  it("menyimpan dan membaca blackout", () => {
    expect(writeTheme("blackout")).toBe(true);
    expect(storage.getItem(STORAGE_KEYS.theme)).toBe("blackout");
    expect(readTheme()).toBe("blackout");
  });

  it("kembali ke paper tanpa crash bila storage tidak tersedia", () => {
    delete globalThis.localStorage;
    expect(readTheme()).toBe("paper");
    expect(writeTheme("blackout")).toBe(false);
  });
});
