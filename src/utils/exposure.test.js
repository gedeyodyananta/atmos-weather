import { describe, expect, it } from "vitest";
import { getCigaretteEquivalent } from "./exposure.js";

describe("getCigaretteEquivalent", () => {
  it("memakai rumus PM2.5 / 22 dengan satu desimal", () => {
    expect(getCigaretteEquivalent(22)).toBe(1);
    expect(getCigaretteEquivalent(33)).toBe(1.5);
    expect(getCigaretteEquivalent(50)).toBe(2.3);
    expect(getCigaretteEquivalent(7.7)).toBe(0.4);
  });

  it("menangani nol dan nilai tidak valid", () => {
    expect(getCigaretteEquivalent(0)).toBe(0);
    expect(getCigaretteEquivalent(null)).toBeNull();
    expect(getCigaretteEquivalent(-1)).toBeNull();
    expect(getCigaretteEquivalent(Number.NaN)).toBeNull();
  });
});
