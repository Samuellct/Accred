import { describe, it, expect } from "vitest";
import { parseJSON } from "../json";

const VALID_ARRAY = JSON.stringify([
  { titre: "Anora", date: "2026-05-13", heure: "10:00", salle: "Lumiere", section: "Competition", duree: 139 },
  { titre: "The Substance", date: "2026-05-14", heure: "18:30" },
]);

const VALID_WRAPPER = JSON.stringify({
  seances: [
    { titre: "Anora", date: "2026-05-13", heure: "10:00" },
  ],
});

describe("parseJSON", () => {
  it("parse un tableau valide", () => {
    const result = parseJSON(VALID_ARRAY);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0]).toMatchObject({
      titre: "Anora",
      date: "2026-05-13",
      heure: "10:00",
      duree: 139,
    });
  });

  it("parse le format wrapper { seances: [...] }", () => {
    const result = parseJSON(VALID_WRAPPER);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].titre).toBe("Anora");
  });

  it("accept les cles EN (title, venue)", () => {
    const json = JSON.stringify([
      { title: "Anora", date: "2026-05-13", time: "10:00", venue: "Lumiere" },
    ]);
    const result = parseJSON(json);
    expect(result.errors).toHaveLength(0);
    expect(result.valid[0].titre).toBe("Anora");
    expect(result.valid[0].salle).toBe("Lumiere");
    expect(result.valid[0].heure).toBe("10:00");
  });

  it("erreur si titre manquant", () => {
    const json = JSON.stringify([{ date: "2026-05-13", heure: "10:00" }]);
    const result = parseJSON(json);
    expect(result.errors.some((e) => e.field === "titre")).toBe(true);
    expect(result.valid).toHaveLength(0);
  });

  it("erreur si JSON invalide", () => {
    const result = parseJSON("{ pas du json }");
    expect(result.errors.some((e) => e.field === "json")).toBe(true);
    expect(result.valid).toHaveLength(0);
  });

  it("retourne valid=[] sans erreur si tableau vide", () => {
    const result = parseJSON("[]");
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("erreur si structure non reconnue", () => {
    const result = parseJSON('"juste une chaine"');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("accumule les erreurs de plusieurs elements", () => {
    const json = JSON.stringify([
      { date: "2026-05-13", heure: "10:00" }, // titre manquant
      { titre: "Film X", date: "mauvaise", heure: "10:00" }, // date invalide
    ]);
    const result = parseJSON(json);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
    expect(result.valid).toHaveLength(0);
  });
});
