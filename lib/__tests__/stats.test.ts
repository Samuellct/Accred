import { describe, it, expect } from "vitest";
import { computeFestivalStats } from "../stats";
import type { StatLog, StatFilm, StatSeance } from "../stats";

function log(id: number, filmId: number | null, rating: number | null, tags?: string): StatLog {
  return { id, filmId, rating, tags: tags ?? null };
}

function film(id: number, opts: Partial<StatFilm> = {}): StatFilm {
  return {
    id,
    director: opts.director ?? null,
    duration: opts.duration ?? null,
    genres: opts.genres ?? null,
    countries: opts.countries ?? null,
  };
}

function seance(filmId: number | null, section: string | null): StatSeance {
  return { filmId, section };
}

describe("computeFestivalStats", () => {
  it("zero logs -> tout a zero / null", () => {
    const stats = computeFestivalStats([], [], []);
    expect(stats.totalFilms).toBe(0);
    expect(stats.totalMinutes).toBe(0);
    expect(stats.averageRating).toBeNull();
    expect(stats.satisfactionRate).toBeNull();
    expect(stats.genreBreakdown).toHaveLength(0);
    expect(stats.topDirectors).toHaveLength(0);
  });

  it("totalFilms = nombre de filmIds distincts", () => {
    const stats = computeFestivalStats(
      [log(1, 10, 4), log(2, 10, 3), log(3, 20, 3.5)],
      [film(10), film(20)],
      []
    );
    expect(stats.totalFilms).toBe(2);
  });

  it("totalMinutes = somme durees des films vus", () => {
    const stats = computeFestivalStats(
      [log(1, 10, 4), log(2, 20, 3)],
      [film(10, { duration: 90 }), film(20, { duration: 120 })],
      []
    );
    expect(stats.totalMinutes).toBe(210);
  });

  it("totalMinutes ignore les films sans duration", () => {
    const stats = computeFestivalStats(
      [log(1, 10, 4), log(2, 20, 3)],
      [film(10, { duration: 100 }), film(20, { duration: null })],
      []
    );
    expect(stats.totalMinutes).toBe(100);
  });

  it("averageRating = moyenne des ratings non-null", () => {
    const stats = computeFestivalStats(
      [log(1, 10, 4), log(2, 20, 3), log(3, 30, null)],
      [film(10), film(20), film(30)],
      []
    );
    expect(stats.averageRating).toBe(3.5);
  });

  it("satisfactionRate : 2 notes (4.0 et 2.0) -> 50%", () => {
    const stats = computeFestivalStats(
      [log(1, 10, 4.0), log(2, 20, 2.0)],
      [film(10), film(20)],
      []
    );
    expect(stats.satisfactionRate).toBe(50);
  });

  it("satisfactionRate : toutes les notes >= 3.5 -> 100%", () => {
    const stats = computeFestivalStats(
      [log(1, 10, 3.5), log(2, 20, 4.5), log(3, 30, 5.0)],
      [film(10), film(20), film(30)],
      []
    );
    expect(stats.satisfactionRate).toBe(100);
  });

  it("ratingHistogram contient tous les buckets 0.5-5.0", () => {
    const stats = computeFestivalStats([log(1, 10, 4.0)], [film(10)], []);
    expect(stats.ratingHistogram).toHaveLength(10);
    const bucket4 = stats.ratingHistogram.find((b) => b.bucket === "4");
    expect(bucket4?.count).toBe(1);
    const bucket35 = stats.ratingHistogram.find((b) => b.bucket === "3.5");
    expect(bucket35?.count).toBe(0);
  });

  it("genreBreakdown parse JSON et trie par frequence", () => {
    const stats = computeFestivalStats(
      [log(1, 10, 4), log(2, 20, 3), log(3, 30, 3.5)],
      [
        film(10, { genres: JSON.stringify(["Drame", "Thriller"]) }),
        film(20, { genres: JSON.stringify(["Drame"]) }),
        film(30, { genres: JSON.stringify(["Comedie"]) }),
      ],
      []
    );
    expect(stats.genreBreakdown[0].name).toBe("Drame");
    expect(stats.genreBreakdown[0].count).toBe(2);
  });

  it("countryBreakdown fonctionne de la meme maniere", () => {
    const stats = computeFestivalStats(
      [log(1, 10, 4), log(2, 20, 3)],
      [
        film(10, { countries: JSON.stringify(["France", "USA"]) }),
        film(20, { countries: JSON.stringify(["France"]) }),
      ],
      []
    );
    expect(stats.countryBreakdown[0].name).toBe("France");
    expect(stats.countryBreakdown[0].count).toBe(2);
  });

  it("sectionBreakdown via seances, seulment les films vus", () => {
    const stats = computeFestivalStats(
      [log(1, 10, 4)],
      [film(10), film(20)],
      [seance(10, "Competition"), seance(20, "UCR")] // 20 pas dans les logs
    );
    expect(stats.sectionBreakdown).toHaveLength(1);
    expect(stats.sectionBreakdown[0].name).toBe("Competition");
  });

  it("topDirectors groupes par director, avec avg rating, top 5", () => {
    const stats = computeFestivalStats(
      [log(1, 10, 4.0), log(2, 20, 3.0), log(3, 30, 5.0)],
      [
        film(10, { director: "Dupont" }),
        film(20, { director: "Dupont" }),
        film(30, { director: "Martin" }),
      ],
      []
    );
    expect(stats.topDirectors[0].name).toBe("Dupont");
    expect(stats.topDirectors[0].count).toBe(2);
    expect(stats.topDirectors[0].avgRating).toBe(3.5);
    expect(stats.topDirectors[1].name).toBe("Martin");
    expect(stats.topDirectors[1].avgRating).toBe(5);
  });

  it("tagBreakdown parse les tags de chaque log", () => {
    const stats = computeFestivalStats(
      [
        log(1, 10, 4, JSON.stringify(["emouvant", "chef-oeuvre"])),
        log(2, 20, 3, JSON.stringify(["emouvant"])),
      ],
      [film(10), film(20)],
      []
    );
    expect(stats.tagBreakdown[0].name).toBe("emouvant");
    expect(stats.tagBreakdown[0].count).toBe(2);
  });
});
