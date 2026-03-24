import { describe, it, expect } from "vitest";
import { generateLetterboxdCSV } from "../letterboxd";
import type { LetterboxdLog } from "../letterboxd";

function makeLog(overrides: Partial<LetterboxdLog> = {}): LetterboxdLog {
  return {
    id: 1,
    filmTitle: "Film Test",
    filmYear: 2024,
    director: "Jean Dupont",
    rating: 4.0,
    seenAt: "2024-05-15",
    tags: JSON.stringify(["emouvant", "chef-oeuvre"]),
    longCritique: null,
    letterboxdExported: 0,
    ...overrides,
  };
}

describe("generateLetterboxdCSV", () => {
  it("retourne le header meme avec des logs vides", () => {
    const { csv, exportedIds } = generateLetterboxdCSV([]);
    expect(csv).toBe("Title,Year,Directors,Rating10,WatchedDate,Rewatch,Tags,Review");
    expect(exportedIds).toHaveLength(0);
  });

  it("mapping rating : 3.5 -> 7, 5.0 -> 10, 2.5 -> 5", () => {
    const { csv } = generateLetterboxdCSV([
      makeLog({ id: 1, filmTitle: "A", rating: 3.5 }),
      makeLog({ id: 2, filmTitle: "B", rating: 5.0 }),
      makeLog({ id: 3, filmTitle: "C", rating: 2.5 }),
    ]);
    const rows = csv.split("\n").slice(1);
    expect(rows[0]).toContain(",7,");
    expect(rows[1]).toContain(",10,");
    expect(rows[2]).toContain(",5,");
  });

  it("rating null -> champ Rating10 vide", () => {
    const { csv } = generateLetterboxdCSV([makeLog({ rating: null })]);
    const row = csv.split("\n")[1];
    // Title,Year,Directors,,WatchedDate...
    const parts = row.split(",");
    expect(parts[3]).toBe(""); // Rating10 vide
  });

  it("exclut les logs deja exportes (letterboxdExported=1)", () => {
    const { csv, exportedIds } = generateLetterboxdCSV([
      makeLog({ id: 1, filmTitle: "Exporte", letterboxdExported: 1 }),
      makeLog({ id: 2, filmTitle: "A exporter", letterboxdExported: 0 }),
    ]);
    const rows = csv.split("\n").slice(1);
    expect(rows).toHaveLength(1);
    expect(csv).toContain("A exporter");
    expect(csv).not.toContain("Exporte");
    expect(exportedIds).toEqual([2]);
  });

  it("exportedIds contient les IDs inclus", () => {
    const { exportedIds } = generateLetterboxdCSV([
      makeLog({ id: 10 }),
      makeLog({ id: 20 }),
      makeLog({ id: 30, letterboxdExported: 1 }),
    ]);
    expect(exportedIds).toEqual([10, 20]);
  });

  it("titre avec virgule est entoure de guillemets", () => {
    const { csv } = generateLetterboxdCSV([makeLog({ filmTitle: "Film, Suite" })]);
    expect(csv).toContain('"Film, Suite"');
  });

  it("review avec newline et guillemets est correctement escapee", () => {
    const critique = 'Un film "magnifique"\navec des surprises';
    const { csv } = generateLetterboxdCSV([makeLog({ longCritique: critique })]);
    // guillemets doubles -> ""
    expect(csv).toContain('"Un film ""magnifique""');
  });

  it("tags JSON sont joins par virgule dans un champ escape", () => {
    const { csv } = generateLetterboxdCSV([
      makeLog({ tags: JSON.stringify(["emouvant", "a-revoir"]) }),
    ]);
    expect(csv).toContain('"emouvant, a-revoir"');
  });

  it("tags null = champ vide", () => {
    const { csv } = generateLetterboxdCSV([makeLog({ tags: null })]);
    // verifier qu'il n'y a pas de contenu non-vide pour tags
    const row = csv.split("\n")[1];
    // Title,Year,Directors,Rating10,WatchedDate,Rewatch,Tags,Review
    // pos 6 = Tags
    // format : "Film Test",2024,Jean Dupont,8,2024-05-15,,, <- Tags vide
    expect(row).toContain(",,");
  });

  it("seenAt null = champ WatchedDate vide", () => {
    const { csv } = generateLetterboxdCSV([makeLog({ seenAt: null })]);
    const row = csv.split("\n")[1];
    // Rating10,WatchedDate -> ,,,
    expect(row.split(",")[4]).toBe("");
  });
});
