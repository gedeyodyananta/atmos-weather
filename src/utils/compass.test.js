import { describe, expect, it } from "vitest";
import { getCompassDirection, getDownwindDirection, normalizeDegrees } from "./compass.js";

describe("getCompassDirection", () => {
  it("memetakan derajat utama ke mata angin", () => {
    expect(getCompassDirection(0)).toMatchObject({ abbr: "N", key: "wind.dir.n", degrees: 0 });
    expect(getCompassDirection(90)).toMatchObject({ abbr: "E", key: "wind.dir.e" });
    expect(getCompassDirection(135)).toMatchObject({ abbr: "SE", key: "wind.dir.se" });
    expect(getCompassDirection(315)).toMatchObject({ abbr: "NW", key: "wind.dir.nw" });
  });

  it("membulatkan ke arah terdekat dan menormalkan sudut", () => {
    expect(getCompassDirection(137)).toMatchObject({ abbr: "SE", degrees: 137 });
    expect(getCompassDirection(-90)).toMatchObject({ abbr: "W", degrees: 270 });
    expect(getCompassDirection(450)).toMatchObject({ abbr: "E", degrees: 90 });
  });

  it("menolak nilai tidak valid", () => {
    expect(getCompassDirection(null)).toBeNull();
    expect(getCompassDirection("90")).toBeNull();
    expect(normalizeDegrees(Number.NaN)).toBeNull();
  });
});

describe("getDownwindDirection", () => {
  it("membalik arah datangnya angin untuk pergerakan asap", () => {
    expect(getDownwindDirection(135)).toMatchObject({ abbr: "NW", key: "wind.dir.nw" });
    expect(getDownwindDirection(0)).toMatchObject({ abbr: "S" });
  });
});
