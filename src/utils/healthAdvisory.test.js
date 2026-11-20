import { describe, expect, it } from "vitest";
import { getHealthAdvisory } from "./healthAdvisory.js";

describe("getHealthAdvisory", () => {
  it("tanpa masker saat udara baik atau sedang", () => {
    expect(getHealthAdvisory(25)).toMatchObject({
      level: "good",
      maskKey: "health.mask.none",
      maskLevel: "none",
    });
    expect(getHealthAdvisory(75)).toMatchObject({
      level: "moderate",
      maskKey: "health.mask.none",
    });
  });

  it("masker medis untuk kelompok sensitif", () => {
    expect(getHealthAdvisory(120)).toMatchObject({
      level: "sensitive",
      maskKey: "health.mask.medical",
      maskLevel: "medical",
    });
  });

  it("mewajibkan N95/KF94 saat tidak sehat ke atas", () => {
    for (const aqi of [160, 250, 380]) {
      expect(getHealthAdvisory(aqi)).toMatchObject({
        maskKey: "health.mask.n95",
        maskLevel: "n95",
      });
    }
  });

  it("mengembalikan key aktivitas dan peringatan sesuai tingkat", () => {
    expect(getHealthAdvisory(30).activityKey).toBe("health.activity.good");
    expect(getHealthAdvisory(180).activityKey).toBe("health.activity.unhealthy");
    expect(getHealthAdvisory(350).sensitiveKey).toBe("health.sensitive.hazardous");
  });

  it("aman untuk AQI tidak valid", () => {
    expect(getHealthAdvisory(null)).toBeNull();
    expect(getHealthAdvisory(-4)).toBeNull();
  });
});
