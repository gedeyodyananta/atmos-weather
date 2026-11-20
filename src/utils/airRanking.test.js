import { describe, expect, it } from "vitest";
import { rankAirQuality } from "./airRanking.js";

const locations = [
  { name: "Pontianak", aqi: 180 },
  { name: "Palangkaraya", aqi: 240 },
  { name: "Jambi", aqi: 95 },
  { name: "Tanpa Data", aqi: null },
];

describe("rankAirQuality", () => {
  it("mengurutkan lokasi dan mengambil udara terbersih/terburuk", () => {
    const result = rankAirQuality(locations);
    expect(result.ranked.map((location) => location.name)).toEqual([
      "Jambi",
      "Pontianak",
      "Palangkaraya",
    ]);
    expect(result.best.name).toBe("Jambi");
    expect(result.worst.name).toBe("Palangkaraya");
  });

  it("mengabaikan lokasi tanpa AQI numerik", () => {
    expect(rankAirQuality([{ name: "A", aqi: null }, { name: "B", aqi: -1 }])).toEqual({
      ranked: [],
      best: null,
      worst: null,
    });
  });

  it("memakai nama sebagai penentu saat AQI sama", () => {
    const result = rankAirQuality([
      { name: "Zeta", aqi: 50 },
      { name: "Alpha", aqi: 50 },
    ]);
    expect(result.ranked.map((location) => location.name)).toEqual(["Alpha", "Zeta"]);
  });

  it("aman untuk input kosong", () => {
    expect(rankAirQuality(null)).toEqual({ ranked: [], best: null, worst: null });
  });
});
