import { describe, it, expect } from "vitest";
import { computeRating, isValidRating, formatRating, PREDEFINED_TAGS } from "../journal";

describe("computeRating", () => {
  const w = 40; // largeur d'une etoile en px

  it("tap gauche de la 1ere etoile = 0.5", () => {
    expect(computeRating(5, w, 0)).toBe(0.5);
  });

  it("tap droit de la 1ere etoile = 1.0", () => {
    expect(computeRating(30, w, 0)).toBe(1);
  });

  it("tap gauche de la 3eme etoile = 2.5", () => {
    expect(computeRating(10, w, 2)).toBe(2.5);
  });

  it("tap droit de la 3eme etoile = 3.0", () => {
    expect(computeRating(25, w, 2)).toBe(3);
  });

  it("tap gauche de la 5eme etoile = 4.5", () => {
    expect(computeRating(5, w, 4)).toBe(4.5);
  });

  it("tap droit de la 5eme etoile = 5.0", () => {
    expect(computeRating(39, w, 4)).toBe(5);
  });

  it("clamp a 5 max", () => {
    expect(computeRating(39, w, 4)).toBe(5);
  });
});

describe("isValidRating", () => {
  it("accepte 0.5", () => expect(isValidRating(0.5)).toBe(true));
  it("accepte 3.5", () => expect(isValidRating(3.5)).toBe(true));
  it("accepte 5.0", () => expect(isValidRating(5)).toBe(true));
  it("accepte 1.0", () => expect(isValidRating(1)).toBe(true));
  it("refuse 0", () => expect(isValidRating(0)).toBe(false));
  it("refuse 5.5", () => expect(isValidRating(5.5)).toBe(false));
  it("refuse negatif", () => expect(isValidRating(-1)).toBe(false));
  it("refuse non-multiple de 0.5", () => expect(isValidRating(3.3)).toBe(false));
});

describe("formatRating", () => {
  it("entier sans decimale", () => expect(formatRating(4)).toBe("4"));
  it("demi avec virgule FR", () => expect(formatRating(3.5)).toBe("3,5"));
  it("1.0 sans decimale", () => expect(formatRating(1)).toBe("1"));
  it("0.5 avec virgule", () => expect(formatRating(0.5)).toBe("0,5"));
});

describe("PREDEFINED_TAGS", () => {
  it("contient les 5 tags attendus", () => {
    expect(PREDEFINED_TAGS).toHaveLength(5);
    expect(PREDEFINED_TAGS).toContain("emouvant");
    expect(PREDEFINED_TAGS).toContain("chef-oeuvre");
    expect(PREDEFINED_TAGS).toContain("a-revoir");
  });

  it("pas de doublons", () => {
    expect(new Set(PREDEFINED_TAGS).size).toBe(PREDEFINED_TAGS.length);
  });
});
