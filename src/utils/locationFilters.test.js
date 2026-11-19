import { describe, expect, it } from "vitest";
import {
  filterLocations,
  getFilterOptions,
  LOCATION_SCOPE_ALL,
  LOCATION_SORT_OPTIONS,
  sortLocations,
} from "./locationFilters.js";

const bandung = {
  id: "1",
  name: "Bandung",
  admin1: "Jawa Barat",
  country: "Indonesia",
  timezone: "Asia/Jakarta",
  latitude: -6.9175,
  longitude: 107.6191,
  temperature: 26.3,
  aqi: 154,
  isFavorite: true,
};

const kutaSelatan = {
  id: "2",
  name: "Kuta Selatan",
  admin1: "Bali",
  country: "Indonesia",
  timezone: "Asia/Makassar",
  latitude: -8.7833,
  longitude: 115.1667,
  temperature: 29.9,
  aqi: 51,
  isFavorite: false,
};

const auckland = {
  id: "3",
  name: "Auckland",
  admin1: "Auckland",
  country: "Selandia Baru",
  timezone: "Pacific/Auckland",
  latitude: -36.8485,
  longitude: 174.7633,
  temperature: 18.2,
  aqi: null,
  isFavorite: false,
};

const sample = [bandung, kutaSelatan, auckland];

describe("filterLocations — pencarian", () => {
  it("mencocokkan nama kota tanpa memandang huruf besar/kecil", () => {
    expect(filterLocations(sample, { query: "bandung" }).map((item) => item.id)).toEqual(["1"]);
    expect(filterLocations(sample, { query: "BANDUNG" }).map((item) => item.id)).toEqual(["1"]);
    expect(filterLocations(sample, { query: "  BaNdUnG  " }).map((item) => item.id)).toEqual(["1"]);
  });

  it("mencari juga pada negara dan zona waktu, dan mengembalikan array kosong bila tidak ada", () => {
    expect(filterLocations(sample, { query: "selandia" }).map((item) => item.id)).toEqual(["3"]);
    expect(filterLocations(sample, { query: "asia/jakarta" }).map((item) => item.id)).toEqual(["1"]);
    expect(filterLocations(sample, { query: "zzzqqq" })).toEqual([]);
  });
});

describe("filterLocations — scope filter", () => {
  it("hanya mengembalikan favorit saat scope favorit", () => {
    expect(filterLocations(sample, { scope: "favorites" }).map((item) => item.id)).toEqual(["1"]);
  });

  it("scope wilayah tidak valid menghasilkan daftar kosong, bukan semua data", () => {
    expect(filterLocations(sample, { scope: "country:Atlantis" })).toEqual([]);
    expect(filterLocations(sample, { scope: "timezone:Mars/Olympus" })).toEqual([]);
  });

  it("scope tak dikenal diperlakukan sebagai semua lokasi dan digabung dengan query", () => {
    expect(filterLocations(sample, { scope: "bogus" })).toHaveLength(3);
    expect(
      filterLocations(sample, { scope: LOCATION_SCOPE_ALL, query: "kuta", sort: "name-asc" }).map(
        (item) => item.name
      )
    ).toEqual(["Kuta Selatan"]);
  });

  it("filter scope, query, dan sort bekerja bersamaan", () => {
    const result = filterLocations(sample, {
      scope: "country:Indonesia",
      query: "a",
      sort: "temperature-desc",
    });
    expect(result.map((item) => item.name)).toEqual(["Kuta Selatan", "Bandung"]);
  });
});

describe("filterLocations — pengurutan", () => {
  it("mengurutkan suhu terdingin/terpanas dan menaruh nilai null di belakang", () => {
    expect(sortLocations(sample, "temperature-asc").map((item) => item.name)).toEqual([
      "Auckland",
      "Bandung",
      "Kuta Selatan",
    ]);
    expect(sortLocations(sample, "temperature-desc").map((item) => item.name)).toEqual([
      "Kuta Selatan",
      "Bandung",
      "Auckland",
    ]);
  });

  it("mengurutkan AQI terbaik dan nama A–Z", () => {
    expect(sortLocations(sample, "aqi-asc").map((item) => item.name)).toEqual([
      "Kuta Selatan",
      "Bandung",
      "Auckland",
    ]);
    expect(sortLocations(sample, "name-asc").map((item) => item.name)).toEqual([
      "Auckland",
      "Bandung",
      "Kuta Selatan",
    ]);
  });

  it("mengembalikan array kosong untuk semua opsi sort pada daftar kosong", () => {
    for (const { value } of LOCATION_SORT_OPTIONS) {
      expect(filterLocations([], { sort: value })).toEqual([]);
      expect(sortLocations([], value)).toEqual([]);
    }
    expect(filterLocations(undefined, { sort: "aqi-asc" })).toEqual([]);
  });

  it("tidak mengubah array masukan dan menurunkan opsi filter unik", () => {
    const original = [...sample];
    filterLocations(sample, { sort: "temperature-desc" });
    expect(sample).toEqual(original);

    const options = getFilterOptions(sample);
    expect(options.countries.map((option) => option.label)).toEqual(["Indonesia", "Selandia Baru"]);
    expect(options.timezones.map((option) => option.value)).toContain("timezone:Asia/Jakarta");
  });
});
