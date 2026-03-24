"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import SeanceCard from "@/components/festival/SeanceCard";
import ConflictAlert from "@/components/festival/ConflictAlert";

interface Film {
  id: number;
  title: string;
  originalTitle: string | null;
  director: string | null;
  year: number | null;
  duration: number | null;
  genres: string | null;
  countries: string | null;
  synopsis: string | null;
  posterPath: string | null;
}

interface SeanceRow {
  id: number;
  dateTime: string;
  venue: string | null;
  section: string | null;
  format: string | null;
  selected: boolean;
  selectionId: number | null;
}

interface ConflictItem {
  existingSeanceId: number;
  existingFilmTitle: string;
  existingDateTime: string;
  existingVenue: string | null;
  type: "overlap" | "buffer";
  alternative: { seanceId: number; dateTime: string; venue: string | null } | null;
}

function parseTags(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json) as string[]; } catch { return []; }
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, "0") : ""}` : `${m}min`;
}

export default function FilmDetailPage() {
  const { id, filmId } = useParams<{ id: string; filmId: string }>();
  const router = useRouter();

  const [film, setFilm] = useState<Film | null>(null);
  const [filmSeances, setFilmSeances] = useState<SeanceRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectionsMap, setSelectionsMap] = useState<Map<number, number>>(new Map());
  const [conflicts, setConflicts] = useState<ConflictItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/festivals/${id}/films/${filmId}`);
        if (!res.ok) { router.push(`/festivals/${id}/programme`); return; }
        const data = await res.json() as { film: Film; seances: SeanceRow[] };
        setFilm(data.film);
        setFilmSeances(data.seances);
        const ids = new Set(data.seances.filter((s) => s.selected).map((s) => s.id));
        const map = new Map(
          data.seances.filter((s) => s.selectionId).map((s) => [s.id, s.selectionId!])
        );
        setSelectedIds(ids);
        setSelectionsMap(map);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id, filmId, router]);

  const handleToggle = useCallback(async (seanceId: number) => {
    const wasSelected = selectedIds.has(seanceId);

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (wasSelected) { next.delete(seanceId); } else { next.add(seanceId); }
      return next;
    });

    if (wasSelected) {
      const selId = selectionsMap.get(seanceId);
      if (!selId) return;
      setSelectionsMap((prev) => { const next = new Map(prev); next.delete(seanceId); return next; });
      try {
        await fetch(`/api/festivals/${id}/selections/${selId}`, { method: "DELETE" });
      } catch {
        setSelectedIds((prev) => { const next = new Set(prev); next.add(seanceId); return next; });
        setSelectionsMap((prev) => { const next = new Map(prev); next.set(seanceId, selId); return next; });
      }
    } else {
      try {
        const res = await fetch(`/api/festivals/${id}/selections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seanceId }),
        });
        if (!res.ok) {
          setSelectedIds((prev) => { const next = new Set(prev); next.delete(seanceId); return next; });
          return;
        }
        const data = await res.json() as { selection: { id: number }; conflicts: ConflictItem[] };
        setSelectionsMap((prev) => { const next = new Map(prev); next.set(seanceId, data.selection.id); return next; });
        if (data.conflicts?.length > 0) setConflicts(data.conflicts);
      } catch {
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(seanceId); return next; });
      }
    }
  }, [id, selectedIds, selectionsMap]);

  const handleSwap = useCallback(async (oldSeanceId: number, newSeanceId: number) => {
    const oldSelId = selectionsMap.get(oldSeanceId);
    if (oldSelId) {
      await fetch(`/api/festivals/${id}/selections/${oldSelId}`, { method: "DELETE" });
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(oldSeanceId); return next; });
      setSelectionsMap((prev) => { const next = new Map(prev); next.delete(oldSeanceId); return next; });
    }
    await handleToggle(newSeanceId);
    setConflicts(null);
  }, [id, selectionsMap, handleToggle]);

  if (loading) {
    return <div className="px-4 py-6"><p className="text-gris-c text-sm">Chargement...</p></div>;
  }

  if (!film) return null;

  const genres = parseTags(film.genres);
  const countries = parseTags(film.countries);
  const dur = formatDuration(film.duration);

  return (
    <div>
      {/* header sombre avec poster */}
      <div className="relative bg-noir overflow-hidden" style={{ minHeight: "200px" }}>
        {film.posterPath && (
          <>
            <Image
              src={film.posterPath}
              alt={film.title}
              fill
              unoptimized
              className="object-cover opacity-25"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/80 to-transparent" />
          </>
        )}
        <div className="relative z-10 px-4 pt-8 pb-6 flex gap-4 items-end">
          {film.posterPath && (
            <div className="flex-shrink-0 w-20 shadow-lg relative" style={{ height: "120px" }}>
              <Image src={film.posterPath} alt={film.title} fill unoptimized className="object-cover" sizes="80px" />
            </div>
          )}
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="font-serif text-xl text-parchemin leading-tight">{film.title}</h1>
            {film.originalTitle && film.originalTitle !== film.title && (
              <p className="text-gris-c text-xs mt-0.5 italic">{film.originalTitle}</p>
            )}
            {film.director && (
              <p className="text-or-chaud text-sm mt-1">{film.director}</p>
            )}
          </div>
        </div>

        {/* bouton retour */}
        <button
          onClick={() => router.back()}
          className="absolute top-3 left-3 text-gris-c hover:text-parchemin transition-colors duration-[0.15s] z-20"
          aria-label="Retour"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      </div>

      {/* infos film */}
      <div className="px-4 py-4 bg-parchemin border-b border-creme-f">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gris-c">
          {film.year && <span>{film.year}</span>}
          {dur && <span>{dur}</span>}
          {countries.length > 0 && <span>{countries.join(", ")}</span>}
        </div>
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {genres.map((g) => (
              <span key={g} className="text-[0.6rem] uppercase tracking-widest text-or border border-or/30 px-2 py-0.5">
                {g}
              </span>
            ))}
          </div>
        )}
        {film.synopsis && (
          <p className="text-brun text-sm mt-3 leading-relaxed">{film.synopsis}</p>
        )}
      </div>

      {/* conflits */}
      {conflicts && conflicts.length > 0 && (
        <div className="px-4 pt-3">
          <ConflictAlert
            conflicts={conflicts}
            onSwap={handleSwap}
            onDismiss={() => setConflicts(null)}
          />
        </div>
      )}

      {/* seances */}
      <div className="px-4 py-4">
        <h2 className="text-xs uppercase tracking-widest text-gris-c mb-3">
          Seances ({filmSeances.length})
        </h2>
        {filmSeances.length === 0 ? (
          <p className="text-gris-c text-sm">Aucune seance programmee.</p>
        ) : (
          <div className="space-y-px">
            {filmSeances.map((s) => (
              <SeanceCard
                key={s.id}
                seance={s}
                film={film}
                selected={selectedIds.has(s.id)}
                onToggle={handleToggle}
                festivalId={id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
