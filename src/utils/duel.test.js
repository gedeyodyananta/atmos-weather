import { describe, expect, it } from "vitest";
import { buildBattleCandidates, compareFighters, pickOpponent } from "./duel.js";

function fighter(name, airQuality, visibility = 10000) {
  return {
    location: { id: name, name, latitude: -6.2, longitude: 106.8 },
    weather: { current: { visibility } },
    airQuality,
  };
}

describe("compareFighters", () => {
  it("menilai polutan lebih rendah dan jarak pandang lebih tinggi", () => {
    const result = compareFighters(
      fighter("A", { aqi: 42, pm25: 8, pm10: 20, o3: 80 }, 12000),
      fighter("B", { aqi: 95, pm25: 35, pm10: 50, o3: 60 }, 6000)
    );

    expect(result.score).toMatchObject({ a: 4, b: 1, ties: 0, compared: 5 });
    expect(result.winner).toBe("a");
    expect(result.rows.find((row) => row.key === "visibility")?.winner).toBe("a");
  });

  it("melewati metrik yang tidak tersedia di kedua sisi", () => {
    const result = compareFighters(
      fighter("A", { aqi: 42, pm25: null, pm10: 20, o3: null }, null),
      fighter("B", { aqi: 52, pm25: 12, pm10: null, o3: null }, 8000)
    );

    expect(result.rows.find((row) => row.key === "pm25")?.winner).toBeNull();
    expect(result.rows.find((row) => row.key === "aqi")?.winner).toBe("a");
    expect(result.score.compared).toBe(1);
    expect(result.winner).toBe("a");
  });

  it("menghasilkan seri saat semua metrik sama", () => {
    const result = compareFighters(
      fighter("A", { aqi: 42, pm25: 8, pm10: 20, o3: 80 }, 10000),
      fighter("B", { aqi: 42, pm25: 8, pm10: 20, o3: 80 }, 10000)
    );

    expect(result.winner).toBe("tie");
    expect(result.score.ties).toBe(5);
    expect(result.score.compared).toBe(5);
  });
});

describe("buildBattleCandidates", () => {
  it("menggabungkan kota aktif, tersimpan, dan preset tanpa duplikat koordinat", () => {
    const active = { id: "a", name: "A", latitude: -6.2, longitude: 106.8 };
    const saved = [
      { id: "b", name: "B", latitude: -6.9, longitude: 107.6 },
      { id: "a-copy", name: "A copy", latitude: -6.2, longitude: 106.8 },
    ];
    const presets = [
      { id: "c", name: "C", latitude: -2.2, longitude: 113.9 },
      { id: "b", name: "B duplicate", latitude: -6.9, longitude: 107.6 },
    ];

    const candidates = buildBattleCandidates({ active, saved, presets });
    expect(candidates.map((location) => location.id)).toEqual(["a", "b", "c"]);
    expect(pickOpponent(candidates, "a")?.id).toBe("b");
    expect(pickOpponent(candidates, "c")?.id).toBe("a");
  });

  it("mengabaikan lokasi tanpa koordinat valid", () => {
    expect(
      buildBattleCandidates({
        active: { id: "x", name: "X" },
        saved: [{ id: "y", name: "Y", latitude: "invalid", longitude: 1 }],
      })
    ).toEqual([]);
  });
});
