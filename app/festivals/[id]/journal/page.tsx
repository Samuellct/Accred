"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import RatingStars from "@/components/journal/RatingStars";
import { formatRating } from "@/lib/journal";

interface Film {
  id: number;
  title: string;
  director: string | null;
  posterPath: string | null;
  duration: number | null;
}

interface LogEntry {
  id: number;
  filmId: number | null;
  rating: number | null;
  text: string | null;
  longCritique: string | null;
  letterboxdExported: number;
  tags: string | null;
  seenAt: string | null;
  createdAt: string;
  film: Film | null;
}

interface SelectionRow {
  seanceId: number;
  seance: { dateTime: string };
  film: Film | null;
}

function dateKey(dt: string): string {
  return dt.slice(0, 10);
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function parseTags(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json) as string[]; } catch { return []; }
}

async function downloadLetterboxd(festivalId: string, onDone: () => void) {
  const res = await fetch(`/api/festivals/${festivalId}/export/letterboxd`);
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "accred-letterboxd.csv";
  a.click();
  URL.revokeObjectURL(url);
  onDone();
}

export default function JournalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [unrated, setUnrated] = useState<{ filmId: number; film: Film }[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [logsRes, selsRes] = await Promise.all([
          fetch(`/api/festivals/${id}/journal`),
          fetch(`/api/festivals/${id}/selections`),
        ]);
        const logs = await logsRes.json() as LogEntry[];
        const sels = await selsRes.json() as SelectionRow[];

        setEntries(logs);

        // films dans des seances passees mais pas encore notes
        const loggedIds = new Set(logs.map((l) => l.filmId).filter(Boolean));
        const now = new Date().toISOString();
        const seen = new Set<number>();
        const candidates: { filmId: number; film: Film }[] = [];
        for (const s of sels) {
          if (!s.film || !s.seance.dateTime || s.seance.dateTime >= now) continue;
          if (loggedIds.has(s.film.id) || seen.has(s.film.id)) continue;
          seen.add(s.film.id);
          candidates.push({ filmId: s.film.id, film: s.film });
        }
        setUnrated(candidates);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) {
    return <div className="px-4 py-6"><p className="text-gris-c text-sm">Chargement...</p></div>;
  }

  // grouper les entries par jour (seenAt ou createdAt)
  const days = Array.from(new Set(entries.map((e) => dateKey(e.seenAt ?? e.createdAt)))).sort().reverse();
  const exportableCount = entries.filter((e) => e.letterboxdExported !== 1).length;

  async function handleExport() {
    setExporting(true);
    await downloadLetterboxd(id, () => {
      // re-charger les entries pour MAJ les badges "Exporte"
      void fetch(`/api/festivals/${id}/journal`)
        .then((r) => r.json())
        .then((logs: LogEntry[]) => setEntries(logs))
        .finally(() => setExporting(false));
    });
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-2xl text-brun">Journal</h2>
        <div className="flex items-center gap-3">
          {exportableCount > 0 && (
            <button
              onClick={() => void handleExport()}
              disabled={exporting}
              className="text-xs uppercase tracking-widest text-gris-c hover:text-or transition-colors duration-[0.15s] disabled:opacity-50"
            >
              {exporting ? "Export..." : `Letterboxd (${exportableCount})`}
            </button>
          )}
          <button
            onClick={() => router.push(`/festivals/${id}/journal/new`)}
            className="text-xs uppercase tracking-widest text-or hover:opacity-70 transition-opacity duration-[0.15s]"
          >
            + Noter
          </button>
        </div>
      </div>

      {/* section films non notes */}
      {unrated.length > 0 && (
        <div className="mb-5">
          <p className="text-[0.6rem] uppercase tracking-widest text-gris-c mb-2">A noter</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {unrated.map(({ filmId, film }) => (
              <button
                key={filmId}
                onClick={() => router.push(`/festivals/${id}/journal/new?filmId=${filmId}`)}
                className="flex-shrink-0 flex flex-col items-center gap-1 w-20 text-left"
              >
                <div className="relative w-16 bg-noir/10" style={{ height: "88px" }}>
                  {film.posterPath ? (
                    <Image src={film.posterPath} alt={film.title} fill unoptimized className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gris-c text-[0.55rem]">?</span>
                    </div>
                  )}
                  <div className="absolute top-1 right-1 bg-or-chaud text-parchemin text-[0.5rem] uppercase tracking-widest px-1 leading-tight">
                    A noter
                  </div>
                </div>
                <span className="font-serif text-brun text-[0.6rem] text-center leading-tight line-clamp-2 w-full">
                  {film.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* entries par jour */}
      {entries.length === 0 && unrated.length === 0 && (
        <div>
          <p className="text-gris-c text-sm mt-4">{"Aucune note pour l'instant."}</p>
          <a
            href="programme"
            className="inline-block mt-4 text-xs uppercase tracking-widest text-or hover:opacity-70 transition-opacity duration-[0.15s]"
          >
            Voir le programme →
          </a>
        </div>
      )}

      {days.map((day) => {
        const dayEntries = entries.filter((e) => dateKey(e.seenAt ?? e.createdAt) === day);
        return (
          <div key={day} className="mb-6">
            <h3 className="text-xs uppercase tracking-widest text-gris-c mb-3 capitalize">
              {formatFullDate(day)}
            </h3>
            <div className="space-y-px">
              {dayEntries.map((entry) => {
                const entryTags = parseTags(entry.tags);
                return (
                  <button
                    key={entry.id}
                    onClick={() => router.push(`/festivals/${id}/journal/${entry.id}/edit`)}
                    className="w-full flex items-start gap-3 bg-parchemin border border-or/25 px-3 py-2.5 text-left hover:bg-creme transition-colors duration-[0.15s]"
                  >
                    {/* poster */}
                    <div className="relative w-10 flex-shrink-0" style={{ height: "56px" }}>
                      {entry.film?.posterPath ? (
                        <Image src={entry.film.posterPath} alt={entry.film.title ?? ""} fill unoptimized className="object-cover" sizes="40px" />
                      ) : (
                        <div className="w-full h-full bg-noir/10 flex items-center justify-center">
                          <span className="text-gris-c text-[0.55rem]">?</span>
                        </div>
                      )}
                    </div>

                    {/* infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-serif text-brun text-sm leading-tight truncate">
                          {entry.film?.title ?? "Film inconnu"}
                        </p>
                        {entry.rating !== null && (
                          <span className="text-or text-xs tabular-nums flex-shrink-0">{formatRating(entry.rating)}</span>
                        )}
                      </div>
                      {entry.film?.director && (
                        <p className="text-gris-c text-xs mt-0.5">{entry.film.director}</p>
                      )}
                      {entry.rating !== null && (
                        <div className="mt-1">
                          <RatingStars value={entry.rating} readOnly size="sm" />
                        </div>
                      )}
                      {entryTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {entryTags.map((t) => (
                            <span key={t} className="text-[0.55rem] text-gris-c border border-creme-f px-1.5 py-0.5">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.text && (
                        <p className="text-brun text-xs mt-1.5 leading-relaxed line-clamp-2">{entry.text}</p>
                      )}
                      {/* indicateurs critique + exporte */}
                      <div className="flex gap-2 mt-1">
                        {entry.longCritique && (
                          <span className="text-[0.5rem] uppercase tracking-widest text-or">Critique</span>
                        )}
                        {entry.letterboxdExported === 1 && (
                          <span className="text-[0.5rem] uppercase tracking-widest text-gris-c">Exporte</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
