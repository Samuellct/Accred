import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p";

export interface TMDbSearchResult {
  tmdbId: number;
  title: string;
  originalTitle: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
}

export interface TMDbFilmDetails {
  tmdbId: number;
  title: string;
  originalTitle: string;
  director: string | null;
  year: number | null;
  duration: number | null;
  genres: string[];
  countries: string[];
  synopsis: string | null;
  posterPath: string | null;
  imdbId: string | null;
}

// helper interne -- pas de fetch direct dans les composants client, passer par le proxy
async function tmdbFetch(path: string): Promise<unknown> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY manquante");

  const sep = path.includes("?") ? "&" : "?";
  const url = `${TMDB_BASE}${path}${sep}api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDb erreur ${res.status} pour ${path}`);
  }
  return res.json();
}

export async function searchFilm(query: string, year?: number): Promise<TMDbSearchResult[]> {
  const params = new URLSearchParams({ query, language: "fr-FR", include_adult: "false" });
  if (year) params.set("year", String(year));

  const data = await tmdbFetch(`/search/movie?${params}`) as {
    results: Array<{
      id: number;
      title: string;
      original_title: string;
      release_date?: string;
      poster_path?: string | null;
      overview: string;
    }>;
  };

  return (data.results ?? []).map((r) => ({
    tmdbId: r.id,
    title: r.title,
    originalTitle: r.original_title,
    year: r.release_date ? parseInt(r.release_date.slice(0, 4)) : null,
    posterPath: r.poster_path ?? null,
    overview: r.overview,
  }));
}

export async function getFilmDetails(tmdbId: number): Promise<TMDbFilmDetails> {
  const data = await tmdbFetch(`/movie/${tmdbId}?language=fr-FR&append_to_response=credits`) as {
    id: number;
    title: string;
    original_title: string;
    release_date?: string;
    runtime?: number | null;
    genres?: Array<{ name: string }>;
    production_countries?: Array<{ name: string }>;
    overview?: string | null;
    poster_path?: string | null;
    imdb_id?: string | null;
    credits?: {
      crew?: Array<{ job: string; name: string }>;
    };
  };

  // premier realisateur dans les credits
  const director = data.credits?.crew?.find((c) => c.job === "Director")?.name ?? null;

  return {
    tmdbId: data.id,
    title: data.title,
    originalTitle: data.original_title,
    director,
    year: data.release_date ? parseInt(data.release_date.slice(0, 4)) : null,
    duration: data.runtime ?? null,
    genres: (data.genres ?? []).map((g) => g.name),
    countries: (data.production_countries ?? []).map((c) => c.name),
    synopsis: data.overview ?? null,
    posterPath: data.poster_path ?? null,
    imdbId: data.imdb_id ?? null,
  };
}

// telecharge le poster et le sauve dans public/posters/{filmId}.jpg
// retourne le chemin web accessible
export async function downloadPoster(posterPath: string, filmId: number): Promise<string> {
  const url = `${TMDB_IMG}/w342${posterPath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Impossible de telecharger le poster : ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const dir = join(process.cwd(), "public", "posters");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${filmId}.jpg`), buffer);

  return `/posters/${filmId}.jpg`;
}
