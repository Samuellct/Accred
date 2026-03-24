export interface StatLog {
  id: number;
  rating: number | null;
  filmId: number | null;
  tags: string | null; // JSON array
}

export interface StatFilm {
  id: number;
  director: string | null;
  duration: number | null;
  genres: string | null;    // JSON array
  countries: string | null; // JSON array
}

export interface StatSeance {
  filmId: number | null;
  section: string | null;
}

export interface FestivalStats {
  totalFilms: number;
  totalMinutes: number;
  ratingHistogram: { bucket: string; count: number }[];
  averageRating: number | null;
  satisfactionRate: number | null; // % notes >= 3.5
  genreBreakdown: { name: string; count: number }[];
  countryBreakdown: { name: string; count: number }[];
  sectionBreakdown: { name: string; count: number }[];
  topDirectors: { name: string; count: number; avgRating: number | null }[];
  tagBreakdown: { name: string; count: number }[];
}

function parseJSON(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json) as string[]; } catch { return []; }
}

function countItems(items: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    if (item.trim()) map.set(item, (map.get(item) ?? 0) + 1);
  }
  return map;
}

function mapToSorted(map: Map<string, number>): { name: string; count: number }[] {
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

const RATING_BUCKETS = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"];

export function computeFestivalStats(
  logs: StatLog[],
  films: StatFilm[],
  seances: StatSeance[]
): FestivalStats {
  const filmMap = new Map(films.map((f) => [f.id, f]));

  // films uniques vus
  const seenFilmIds = new Set(logs.map((l) => l.filmId).filter((id): id is number => id != null));
  const totalFilms = seenFilmIds.size;

  // duree totale
  let totalMinutes = 0;
  for (const filmId of seenFilmIds) {
    const film = filmMap.get(filmId);
    if (film?.duration) totalMinutes += film.duration;
  }

  // notes
  const ratings = logs.map((l) => l.rating).filter((r): r is number => r != null);
  const averageRating = ratings.length > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;
  const satisfactionRate = ratings.length > 0
    ? Math.round((ratings.filter((r) => r >= 3.5).length / ratings.length) * 100)
    : null;

  // histogramme
  const histMap = new Map<string, number>(RATING_BUCKETS.map((b) => [b, 0]));
  for (const r of ratings) {
    const key = String(r % 1 === 0 ? r : r); // ex: 3.5 -> "3.5", 4 -> "4"
    const bucket = RATING_BUCKETS.find((b) => Math.abs(Number(b) - r) < 0.01);
    if (bucket) histMap.set(bucket, (histMap.get(bucket) ?? 0) + 1);
  }
  const ratingHistogram = RATING_BUCKETS.map((b) => ({ bucket: b, count: histMap.get(b) ?? 0 }));

  // genres / pays depuis les films vus
  const genreItems: string[] = [];
  const countryItems: string[] = [];
  for (const filmId of seenFilmIds) {
    const film = filmMap.get(filmId);
    if (!film) continue;
    genreItems.push(...parseJSON(film.genres));
    countryItems.push(...parseJSON(film.countries));
  }
  const genreBreakdown = mapToSorted(countItems(genreItems));
  const countryBreakdown = mapToSorted(countItems(countryItems));

  // sections depuis les seances
  const sectionItems: string[] = [];
  for (const s of seances) {
    if (s.filmId && seenFilmIds.has(s.filmId) && s.section) {
      sectionItems.push(s.section);
    }
  }
  const sectionBreakdown = mapToSorted(countItems(sectionItems));

  // realisateurs
  const directorFilms = new Map<string, number[]>(); // director -> filmIds
  const directorRatings = new Map<string, number[]>();
  for (const log of logs) {
    if (!log.filmId) continue;
    const film = filmMap.get(log.filmId);
    if (!film?.director) continue;
    if (!directorFilms.has(film.director)) directorFilms.set(film.director, []);
    directorFilms.get(film.director)!.push(log.filmId);
    if (log.rating != null) {
      if (!directorRatings.has(film.director)) directorRatings.set(film.director, []);
      directorRatings.get(film.director)!.push(log.rating);
    }
  }
  const topDirectors = Array.from(directorFilms.entries())
    .map(([name, filmIds]) => {
      const uniq = new Set(filmIds).size;
      const rs = directorRatings.get(name) ?? [];
      const avg = rs.length > 0
        ? Math.round((rs.reduce((a, b) => a + b, 0) / rs.length) * 10) / 10
        : null;
      return { name, count: uniq, avgRating: avg };
    })
    .sort((a, b) => b.count - a.count || (b.avgRating ?? 0) - (a.avgRating ?? 0))
    .slice(0, 5);

  // tags
  const tagItems: string[] = [];
  for (const log of logs) {
    tagItems.push(...parseJSON(log.tags));
  }
  const tagBreakdown = mapToSorted(countItems(tagItems));

  return {
    totalFilms,
    totalMinutes,
    ratingHistogram,
    averageRating,
    satisfactionRate,
    genreBreakdown,
    countryBreakdown,
    sectionBreakdown,
    topDirectors,
    tagBreakdown,
  };
}
