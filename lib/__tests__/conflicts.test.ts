import { describe, it, expect } from "vitest";
import { detectConflicts, suggestAlternative } from "../conflicts";
import type { SeanceWithFilm } from "../conflicts";

function makeSeance(
  id: number,
  dateTime: string,
  duration: number | null = 120,
  filmId = 1,
  filmTitle = "Film " + id,
  venue: string | null = "Lumiere"
): SeanceWithFilm {
  return { id, filmId, dateTime, duration, filmTitle, venue };
}

describe("detectConflicts", () => {
  it("detecte un chevauchement exact (meme heure)", () => {
    const newSeance = makeSeance(2, "2026-05-13T10:00", 120);
    const selected = [makeSeance(1, "2026-05-13T10:00", 120)];
    const conflicts = detectConflicts(newSeance, selected, 20);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("overlap");
  });

  it("detecte un chevauchement partiel", () => {
    // film 1: 10:00-12:00, film 2: 11:30-13:30 -> overlap 30min
    const newSeance = makeSeance(2, "2026-05-13T11:30", 120);
    const selected = [makeSeance(1, "2026-05-13T10:00", 120)];
    const conflicts = detectConflicts(newSeance, selected, 20);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("overlap");
  });

  it("detecte un conflit de buffer seulement (termine 10min avant, buffer=20)", () => {
    // film 1: 10:00-12:00, film 2: 12:10 -> 10min de battement, buffer=20 -> conflit buffer
    const newSeance = makeSeance(2, "2026-05-13T12:10", 120);
    const selected = [makeSeance(1, "2026-05-13T10:00", 120)];
    const conflicts = detectConflicts(newSeance, selected, 20);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("buffer");
  });

  it("pas de conflit si ecart suffisant (30min, buffer=20)", () => {
    // film 1: 10:00-12:00, film 2: 12:30 -> 30min de battement > buffer 20
    const newSeance = makeSeance(2, "2026-05-13T12:30", 120);
    const selected = [makeSeance(1, "2026-05-13T10:00", 120)];
    const conflicts = detectConflicts(newSeance, selected, 20);
    expect(conflicts).toHaveLength(0);
  });

  it("utilise 120min par defaut si duree inconnue", () => {
    // film 1: 10:00 duree=null (=> 120min = 12:00), film 2: 11:30 -> overlap
    const newSeance = makeSeance(2, "2026-05-13T11:30", null);
    const selected = [makeSeance(1, "2026-05-13T10:00", null)];
    const conflicts = detectConflicts(newSeance, selected, 20);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("overlap");
  });

  it("ignore la seance elle-meme dans les selections", () => {
    // si la seance est deja dans les selections, pas de conflit avec elle-meme
    const seance = makeSeance(1, "2026-05-13T10:00", 120);
    const conflicts = detectConflicts(seance, [seance], 20);
    expect(conflicts).toHaveLength(0);
  });

  it("detecte plusieurs conflits simultanes", () => {
    const newSeance = makeSeance(3, "2026-05-13T10:30", 60, 3);
    const selected = [
      makeSeance(1, "2026-05-13T10:00", 120, 1),
      makeSeance(2, "2026-05-13T10:00", 120, 2),
    ];
    const conflicts = detectConflicts(newSeance, selected, 20);
    expect(conflicts).toHaveLength(2);
  });

  it("pas de conflit si liste vide", () => {
    const newSeance = makeSeance(1, "2026-05-13T10:00", 120);
    expect(detectConflicts(newSeance, [], 20)).toHaveLength(0);
  });
});

describe("suggestAlternative", () => {
  it("suggere une seance alternative sans conflit", () => {
    // film 42 a deux seances: 10:00 (en conflit) et 18:00 (libre)
    const allSeances: SeanceWithFilm[] = [
      makeSeance(1, "2026-05-13T10:00", 120, 42, "Film X"),
      makeSeance(2, "2026-05-13T18:00", 120, 42, "Film X"),
    ];
    // on a selectionne seance 3 (autre film) de 10:00 a 12:00
    const selected = [makeSeance(3, "2026-05-13T10:00", 120, 99, "Autre film")];
    // on cherche une alternative au film 42 en excluant la seance 1
    const alt = suggestAlternative(42, allSeances, selected, 1, 20);
    expect(alt).not.toBeNull();
    expect(alt!.seanceId).toBe(2);
  });

  it("retourne null si aucune alternative disponible", () => {
    const allSeances: SeanceWithFilm[] = [
      makeSeance(1, "2026-05-13T10:00", 120, 42, "Film X"),
      // seance 2 aussi en conflit
      makeSeance(2, "2026-05-13T11:00", 120, 42, "Film X"),
    ];
    const selected = [makeSeance(3, "2026-05-13T09:00", 180, 99, "Autre film")];
    const alt = suggestAlternative(42, allSeances, selected, 1, 20);
    expect(alt).toBeNull();
  });

  it("retourne null si filmId est null", () => {
    const alt = suggestAlternative(null, [], [], 1);
    expect(alt).toBeNull();
  });

  it("ne propose pas une seance deja selectionnee", () => {
    const allSeances: SeanceWithFilm[] = [
      makeSeance(1, "2026-05-13T10:00", 120, 42, "Film X"),
      makeSeance(2, "2026-05-13T18:00", 120, 42, "Film X"),
    ];
    // seance 2 est deja selectionnee
    const selected = [makeSeance(2, "2026-05-13T18:00", 120, 42, "Film X")];
    const alt = suggestAlternative(42, allSeances, selected, 1, 20);
    expect(alt).toBeNull();
  });
});
