"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LogCard from "@/components/journal/LogCard";

interface Festival {
  id: number;
  name: string;
  startDate: string;
}

interface LogEntry {
  id: number;
  filmId: number | null;
  festivalId: number | null;
  rating: number | null;
  text: string | null;
  longCritique: string | null;
  letterboxdExported: number;
  tags: string | null;
  seenAt: string | null;
  createdAt: string;
  film: { title: string; director: string | null; posterPath: string | null } | null;
  festival: { id: number; name: string } | null;
}

const selectClass = "bg-parchemin border border-creme-f text-brun text-xs px-2 py-1.5 focus:outline-none focus:border-or transition-colors duration-[0.15s]";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [festivalFilter, setFestivalFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [results, setResults] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // charger les festivals au mount pour les filtres
  useEffect(() => {
    void fetch("/api/festivals")
      .then((r) => r.json())
      .then((data: Festival[]) => setFestivals(data));
  }, []);

  // annees disponibles extraites des festivals
  const years = Array.from(new Set(festivals.map((f) => f.startDate.slice(0, 4)))).sort().reverse();

  function buildUrl() {
    const params = new URLSearchParams();
    if (query.trim().length >= 2) params.set("q", query.trim());
    if (festivalFilter) params.set("festivalId", festivalFilter);
    if (yearFilter) params.set("year", yearFilter);
    if (ratingFilter) params.set("ratingMin", ratingFilter);
    return `/api/journal?${params.toString()}`;
  }

  function hasFilter() {
    return query.trim().length >= 2 || festivalFilter !== "" || yearFilter !== "" || ratingFilter !== "";
  }

  async function doSearch() {
    if (!hasFilter()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(buildUrl());
      const data = await res.json() as LogEntry[];
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  // debounce sur le texte, immediate sur les filtres
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void doSearch(); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => { void doSearch(); }, [festivalFilter, yearFilter, ratingFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl text-brun mb-5">Recherche</h1>

      {/* input */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Titre, realisateur, note..."
        className="w-full bg-parchemin border border-creme-f text-brun text-sm px-3 py-2.5 focus:outline-none focus:border-or transition-colors duration-[0.15s] mb-3"
        autoFocus
      />

      {/* filtres */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select
          value={festivalFilter}
          onChange={(e) => setFestivalFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">Tous les festivals</option>
          {festivals.map((f) => (
            <option key={f.id} value={String(f.id)}>{f.name}</option>
          ))}
        </select>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">Toutes les annees</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">Toutes les notes</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={String(n)}>{`>= ${n}`}</option>
          ))}
        </select>
      </div>

      {/* resultats */}
      {loading && (
        <p className="text-gris-c text-sm">Recherche...</p>
      )}

      {!loading && !searched && (
        <p className="text-gris-c text-sm">Chercher dans vos notes.</p>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-gris-c text-sm">Aucun resultat.</p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-px">
          {results.map((entry) => (
            <LogCard
              key={entry.id}
              entry={entry}
              festivalName={entry.festival?.name}
              onClick={() => {
                if (entry.festivalId) {
                  router.push(`/festivals/${entry.festivalId}/journal/${entry.id}/edit`);
                }
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
