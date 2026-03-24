"use client";

import { useState, useEffect, useRef } from "react";

interface TMDbResult {
  tmdbId: number;
  title: string;
  originalTitle: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: TMDbResult) => void;
  placeholder?: string;
}

const TMDB_IMG = "https://image.tmdb.org/t/p/w92";

export default function TMDbAutocomplete({ value, onChange, onSelect, placeholder }: Props) {
  const [results, setResults] = useState<TMDbResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value || value.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ query: value, language: "fr-FR" });
        const res = await fetch(`/api/tmdb/search/movie?${params}`);
        if (!res.ok) throw new Error("Erreur TMDb");
        const data = await res.json() as { results: Array<{
          id: number; title: string; original_title: string;
          release_date?: string; poster_path?: string | null; overview: string;
        }> };
        const mapped: TMDbResult[] = (data.results ?? []).slice(0, 6).map((r) => ({
          tmdbId: r.id,
          title: r.title,
          originalTitle: r.original_title,
          year: r.release_date ? parseInt(r.release_date.slice(0, 4)) : null,
          posterPath: r.poster_path ?? null,
          overview: r.overview,
        }));
        setResults(mapped);
        setOpen(mapped.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  // fermer au clic en dehors
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(result: TMDbResult) {
    onSelect(result);
    onChange(result.title);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder ?? "Titre du film..."}
        className="w-full bg-parchemin border border-creme-f text-brun px-4 py-2.5 text-sm focus:border-or focus:outline-none transition-colors duration-[0.15s]"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gris-c text-xs">...</span>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full bg-parchemin border border-creme-f shadow-md max-h-72 overflow-y-auto">
          {results.map((r) => (
            <li
              key={r.tmdbId}
              onClick={() => handleSelect(r)}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-creme transition-colors duration-[0.15s] border-b border-creme-f last:border-0"
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
              <div className="min-w-0">
                <p className="text-brun text-sm font-medium truncate">{r.title}</p>
                {r.originalTitle !== r.title && (
                  <p className="text-gris-c text-xs italic truncate">{r.originalTitle}</p>
                )}
                {r.year && <p className="text-gris-c text-xs">{r.year}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
