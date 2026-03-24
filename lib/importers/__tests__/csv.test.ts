import { describe, it, expect } from "vitest";
import { parseCSV } from "../csv";

const VALID_CSV = `titre;date;heure;salle;section;duree
Anora;2026-05-13;10:00;Lumiere;Competition;139
The Substance;2026-05-14;18:30;Debussy;Un Certain Regard;
`;

describe("parseCSV", () => {
  it("parse un fichier valide", () => {
    const result = parseCSV(VALID_CSV);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0]).toMatchObject({
      titre: "Anora",
      date: "2026-05-13",
      heure: "10:00",
      salle: "Lumiere",
      section: "Competition",
      duree: 139,
    });
    expect(result.valid[1].salle).toBe("Debussy");
    expect(result.valid[1].duree).toBeUndefined();
  });

  it("ignore les lignes commentees (#)", () => {
    const csv = `# ceci est un commentaire
titre;date;heure
# autre commentaire
Film A;2026-05-13;10:00
`;
    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toHaveLength(1);
  });

  it("erreur si colonne requise manquante (titre)", () => {
    const csv = `date;heure;salle
2026-05-13;10:00;Lumiere
`;
    const result = parseCSV(csv);
    expect(result.errors.some((e) => e.field === "titre")).toBe(true);
    expect(result.valid).toHaveLength(0);
  });

  it("erreur si colonne requise manquante (date)", () => {
    const csv = `titre;heure
Anora;10:00
`;
    const result = parseCSV(csv);
    expect(result.errors.some((e) => e.field === "date")).toBe(true);
  });

  it("erreur si date invalide", () => {
    const csv = `titre;date;heure
Film B;13/05/2026;10:00
`;
    const result = parseCSV(csv);
    expect(result.errors.some((e) => e.field === "date")).toBe(true);
    expect(result.valid).toHaveLength(0);
  });

  it("erreur si heure invalide", () => {
    const csv = `titre;date;heure
Film C;2026-05-13;10h00
`;
    const result = parseCSV(csv);
    expect(result.errors.some((e) => e.field === "heure")).toBe(true);
  });

  it("gere les caracteres UTF-8 accentues", () => {
    const csv = `titre;date;heure;section
L'Amour apres midi;2026-05-14;14:00;Séances Spéciales
`;
    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.valid[0].titre).toBe("L'Amour apres midi");
    expect(result.valid[0].section).toBe("Séances Spéciales");
  });

  it("retourne valid=[] et erreur sur fichier vide", () => {
    const result = parseCSV("");
    expect(result.valid).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("gere les champs entre guillemets avec point-virgule", () => {
    const csv = `titre;date;heure;notes
"Film; un titre etrange";2026-05-13;10:00;ok
`;
    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.valid[0].titre).toBe("Film; un titre etrange");
  });

  it("tolere les espaces autour des valeurs", () => {
    const csv = `titre ; date ; heure
 Anora ; 2026-05-13 ; 10:00
`;
    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.valid[0].titre).toBe("Anora");
  });

  it("headers case-insensitive", () => {
    const csv = `TITRE;DATE;HEURE
Anora;2026-05-13;10:00
`;
    const result = parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toHaveLength(1);
  });

  it("accumule les erreurs de plusieurs lignes", () => {
    const csv = `titre;date;heure
;2026-05-13;10:00
Film D;invalide;10:00
`;
    const result = parseCSV(csv);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
    expect(result.valid).toHaveLength(0);
  });
});
