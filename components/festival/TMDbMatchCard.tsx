"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface Film {
  id: number;
  title: string;
  year: number | null;
  duration: number | null;
  posterPath: string | null;
  tmdbId: number | null;
}

interface TMDbResult {
  tmdbId: number;
  title: string;
  originalTitle: string;
  year: number | null;
  posterPath: string | null;
}

interface Props {
  festivalId: string;
  film: Film;
  onDone: (filmId: number) => void;
}

const TMDB_IMG = "https://image.tmdb.org/t/p/w92";

export default function TMDbMatchCard({ festivalId, film, onDone }: Props) {
  const [query, setQuery] = useState(film.title);
  const [results, setResults] = useState<TMDbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  async function search() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ query, language: "fr-FR" });
      const res = await fetch(`/api/tmdb/search/movie?${params}`);
      const data = await res.json() as { results: Array<{
        id: number; title: string; original_title: string;
        release_date?: string; poster_path?: string | null;
      }> };
      setResults((data.results ?? []).slice(0, 5).map((r) => ({
        tmdbId: r.id,
        title: r.title,
        originalTitle: r.original_title,
        year: r.release_date ? parseInt(r.release_date.slice(0, 4)) : null,
        posterPath: r.poster_path ?? null,
      })));
    } finally {
      setLoading(false);
    }
  }

  async function confirm(tmdbId: number) {
    setConfirming(true);
    try {
      await fetch(`/api/festivals/${festivalId}/films/${film.id}/tmdb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId }),
      });
      setDone(true);
      onDone(film.id);
    } finally {
      setConfirming(false);
    }
  }

  function ignore() {
    setDone(true);
    onDone(film.id);
  }

  if (done) return null;

  return (
    <div className="bg-parchemin border border-or/25 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-serif text-base text-brun">{film.title}</h3>
          {film.year && <p className="text-gris-c text-xs">{film.year}</p>}
          {film.duration && <p className="text-gris-c text-xs">{film.duration} min</p>}
        </div>
        <button
          onClick={ignore}
          className="text-gris-c text-xs uppercase tracking-widest hover:text-brun transition-colors shrink-0"
        >
          Ignorer
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="flex-1 bg-creme border border-creme-f text-brun px-3 py-2 text-sm focus:border-or focus:outline-none transition-colors duration-[0.15s]"
          placeholder="Rechercher sur TMDb..."
        />
        <Button size="sm" variant="secondary" onClick={search} disabled={loading}>
          {loading ? "..." : "Chercher"}
        </Button>
      </div>

      {results.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {results.map((r) => (
            <li
              key={r.tmdbId}
              className="flex items-center gap-3 bg-creme px-3 py-2 border border-creme-f"
            >
              {r.posterPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${TMDB_IMG}${r.posterPath}`}
                  alt={r.title}
                  width={32}
                  height={48}
                  className="shrink-0 object-cover"
                />
              ) : (
                <div className="w-8 h-12 bg-creme-f shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-brun text-sm font-medium truncate">{r.title}</p>
                {r.originalTitle !== r.title && (
                  <p className="text-gris-c text-xs italic truncate">{r.originalTitle}</p>
                )}
                {r.year && <p className="text-gris-c text-xs">{r.year}</p>}
              </div>
              <Button
                size="sm"
                onClick={() => confirm(r.tmdbId)}
                disabled={confirming}
              >
                {confirming ? "..." : "Confirmer"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
