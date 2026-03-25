"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import LogCard from "@/components/journal/LogCard";

interface Festival {
  id: number;
  name: string;
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

function monthKey(dt: string): string {
  return dt.slice(0, 7); // "YYYY-MM"
}

function formatMonth(key: string): string {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default function TimelinePage() {
  const router = useRouter();
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState("");
  const [festivalFilter, setFestivalFilter] = useState("");

  useEffect(() => {
    void fetch("/api/journal")
      .then((r) => r.json())
      .then((data: LogEntry[]) => setAllLogs(data))
      .finally(() => setLoading(false));
  }, []);

  // festivals uniques pour le filtre
  const festivals = useMemo<Festival[]>(() => {
    const map = new Map<number, Festival>();
    for (const l of allLogs) {
      if (l.festival && l.festivalId && !map.has(l.festivalId)) {
        map.set(l.festivalId, l.festival);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allLogs]);

  // annees uniques
  const years = useMemo(() => {
    const s = new Set<string>();
    for (const l of allLogs) {
      const dt = l.seenAt ?? l.createdAt;
      if (dt) s.add(dt.slice(0, 4));
    }
    return Array.from(s).sort().reverse();
  }, [allLogs]);

  // filtrage client-side
  const filtered = useMemo(() => {
    return allLogs.filter((l) => {
      const dt = l.seenAt ?? l.createdAt;
      if (yearFilter && !dt.startsWith(yearFilter)) return false;
      if (festivalFilter && String(l.festivalId) !== festivalFilter) return false;
      return true;
    });
  }, [allLogs, yearFilter, festivalFilter]);

  // grouper par mois, tri desc
  const groups = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    for (const l of filtered) {
      const dt = l.seenAt ?? l.createdAt;
      const key = monthKey(dt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  if (loading) {
    return <div className="px-4 py-6"><p className="text-gris-c text-sm">Chargement...</p></div>;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-2xl text-brun">Timeline</h1>
        {filtered.length > 0 && (
          <span className="text-gris-c text-xs">{filtered.length} film{filtered.length > 1 ? "s" : ""}</span>
        )}
      </div>

      {/* filtres */}
      {allLogs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
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
            value={festivalFilter}
            onChange={(e) => setFestivalFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">Tous les festivals</option>
            {festivals.map((f) => (
              <option key={f.id} value={String(f.id)}>{f.name}</option>
            ))}
          </select>
        </div>
      )}

      {allLogs.length === 0 && (
        <p className="text-gris-c text-sm">Aucun film note pour l&apos;instant.</p>
      )}

      {allLogs.length > 0 && filtered.length === 0 && (
        <p className="text-gris-c text-sm">Aucun film pour ces filtres.</p>
      )}

      {groups.map(([key, entries]) => (
        <div key={key} className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-gris-c mb-3 capitalize">
            {formatMonth(key)}
          </h3>
          <div className="space-y-px">
            {entries.map((entry) => (
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
        </div>
      ))}
    </main>
  );
}
