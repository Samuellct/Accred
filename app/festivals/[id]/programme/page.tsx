"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import SeanceCard from "@/components/festival/SeanceCard";
import ConflictAlert from "@/components/festival/ConflictAlert";
import ProgrammeGrid from "@/components/festival/ProgrammeGrid";

interface Film {
  id: number;
  title: string;
  director: string | null;
  duration: number | null;
  posterPath: string | null;
}

interface Seance {
  id: number;
  dateTime: string;
  venue: string | null;
  section: string | null;
  format: string | null;
  film: Film | null;
}

interface SelectionRow {
  id: number;
  seanceId: number;
  priority: string;
}

interface ConflictItem {
  existingSeanceId: number;
  existingFilmTitle: string;
  existingDateTime: string;
  existingVenue: string | null;
  type: "overlap" | "buffer";
  alternative: { seanceId: number; dateTime: string; venue: string | null } | null;
}

function dateKey(dateTime: string): string {
  return dateTime.slice(0, 10); // YYYY-MM-DD
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
}

function formatGroupLabel(dateTime: string): string {
  const d = new Date(dateTime);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}h${m}`;
}

export default function ProgrammePage() {
  const { id } = useParams<{ id: string }>();

  const [seances, setSeances] = useState<Seance[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectionsMap, setSelectionsMap] = useState<Map<number, number>>(new Map()); // seanceId -> selectionId
  const [activeDay, setActiveDay] = useState<string>("");
  const [filterVenue, setFilterVenue] = useState<string>("");
  const [filterSection, setFilterSection] = useState<string>("");
  const [filterSelected, setFilterSelected] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [conflicts, setConflicts] = useState<ConflictItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [seancesRes, selectionsRes] = await Promise.all([
          fetch(`/api/festivals/${id}/seances`),
          fetch(`/api/festivals/${id}/selections`),
        ]);
        const seancesData = await seancesRes.json() as Seance[];
        const selectionsData = await selectionsRes.json() as SelectionRow[];

        setSeances(seancesData);

        const ids = new Set(selectionsData.map((s) => s.seanceId));
        const map = new Map(selectionsData.map((s) => [s.seanceId, s.id]));
        setSelectedIds(ids);
        setSelectionsMap(map);

        if (seancesData.length > 0) {
          setActiveDay(dateKey(seancesData[0].dateTime));
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  // jours uniques triés
  const days = Array.from(new Set(seances.map((s) => dateKey(s.dateTime)))).sort();

  // valeurs disponibles pour les filtres (sur le jour actif)
  const daySeances = seances.filter((s) => dateKey(s.dateTime) === activeDay);
  const venues = Array.from(new Set(daySeances.map((s) => s.venue).filter(Boolean))) as string[];
  const sections = Array.from(new Set(seances.map((s) => s.section).filter(Boolean))) as string[];

  // pipeline de filtres
  const filtered = daySeances.filter((s) => {
    if (filterVenue && s.venue !== filterVenue) return false;
    if (filterSection && s.section !== filterSection) return false;
    if (filterSelected && !selectedIds.has(s.id)) return false;
    if (search) {
      const q = search.toLowerCase();
      const inTitle = s.film?.title.toLowerCase().includes(q) ?? false;
      const inDir = s.film?.director?.toLowerCase().includes(q) ?? false;
      if (!inTitle && !inDir) return false;
    }
    return true;
  });

  // grouper par creneau horaire (HHhMM)
  const groups = new Map<string, Seance[]>();
  for (const s of filtered) {
    const label = formatGroupLabel(s.dateTime);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(s);
  }

  const handleToggle = useCallback(async (seanceId: number) => {
    const wasSelected = selectedIds.has(seanceId);

    // optimistic update
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (wasSelected) { next.delete(seanceId); } else { next.add(seanceId); }
      return next;
    });

    if (wasSelected) {
      const selId = selectionsMap.get(seanceId);
      if (!selId) return;
      setSelectionsMap((prev) => { const next = new Map(prev); next.delete(seanceId); return next; });
      setConflicts(null); // on deselectionne : on efface l'alerte conflit si elle etait visible
      try {
        await fetch(`/api/festivals/${id}/selections/${selId}`, { method: "DELETE" });
      } catch {
        // rollback
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
        const data = await res.json() as { selection: SelectionRow; conflicts: ConflictItem[] };
        setSelectionsMap((prev) => { const next = new Map(prev); next.set(seanceId, data.selection.id); return next; });
        if (data.conflicts?.length > 0) {
          setConflicts(data.conflicts);
        }
      } catch {
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(seanceId); return next; });
      }
    }
  }, [id, selectedIds, selectionsMap]);

  const handleSwap = useCallback(async (oldSeanceId: number, newSeanceId: number) => {
    // retirer l'ancien
    const oldSelId = selectionsMap.get(oldSeanceId);
    if (oldSelId) {
      await fetch(`/api/festivals/${id}/selections/${oldSelId}`, { method: "DELETE" });
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(oldSeanceId); return next; });
      setSelectionsMap((prev) => { const next = new Map(prev); next.delete(oldSeanceId); return next; });
    }
    // ajouter le nouveau
    await handleToggle(newSeanceId);
    setConflicts(null);
  }, [id, selectionsMap, handleToggle]);

  if (loading) {
    return (
      <div className="px-4 py-6">
        <p className="text-gris-c text-sm">Chargement...</p>
      </div>
    );
  }

  if (seances.length === 0) {
    return (
      <div className="px-4 py-6">
        <h2 className="font-serif text-2xl text-brun">Programme</h2>
        <p className="text-gris-c text-sm mt-4">{"Aucune seance pour l'instant."}</p>
        <a
          href="import"
          className="inline-block mt-4 text-xs uppercase tracking-widest text-or hover:opacity-70 transition-opacity duration-[0.15s]"
        >
          Importer des seances →
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* conflit alert */}
      {conflicts && conflicts.length > 0 && (
        <div className="px-4 pt-3">
          <ConflictAlert
            conflicts={conflicts}
            onSwap={handleSwap}
            onDismiss={() => setConflicts(null)}
          />
        </div>
      )}

      {/* onglets jours */}
      <div className="flex overflow-x-auto border-b border-creme-f bg-parchemin scrollbar-none">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => { setActiveDay(day); setFilterVenue(""); }}
            className={`flex-shrink-0 px-4 py-3 text-xs uppercase tracking-widest transition-colors duration-[0.15s] border-b-2 ${
              activeDay === day
                ? "text-or border-or"
                : "text-gris-c border-transparent hover:text-brun"
            }`}
          >
            {formatDayLabel(day)}
          </button>
        ))}
      </div>

      {/* barre filtres */}
      <div className="flex flex-wrap gap-2 px-4 py-3 bg-creme border-b border-creme-f">
        {venues.length > 0 && (
          <select
            value={filterVenue}
            onChange={(e) => setFilterVenue(e.target.value)}
            className="text-xs text-brun bg-parchemin border border-or/25 px-2 py-1.5 focus:outline-none focus:border-or"
          >
            <option value="">Toutes les salles</option>
            {venues.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
        {sections.length > 0 && (
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="text-xs text-brun bg-parchemin border border-or/25 px-2 py-1.5 focus:outline-none focus:border-or"
          >
            <option value="">Toutes les sections</option>
            {sections.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <button
          onClick={() => setFilterSelected((v) => !v)}
          className={`text-xs uppercase tracking-widest px-3 py-1.5 border transition-colors duration-[0.15s] ${
            filterSelected
              ? "bg-or text-parchemin border-or"
              : "text-gris-c border-or/25 hover:border-or hover:text-or"
          }`}
        >
          Mes selections
        </button>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="text-xs text-brun bg-parchemin border border-or/25 px-2 py-1.5 focus:outline-none focus:border-or flex-1 min-w-[120px]"
        />
      </div>

      {/* grille desktop (cachee sur mobile) */}
      <div className="hidden md:block border-b border-creme-f">
        <ProgrammeGrid
          seances={filtered}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          festivalId={id}
        />
      </div>

      {/* liste seances (mobile, cachee sur desktop) */}
      <div className="md:hidden flex-1 px-4 py-4 space-y-4">
        {groups.size === 0 && (
          <p className="text-gris-c text-sm">Aucune seance pour ce filtre.</p>
        )}
        {Array.from(groups.entries()).map(([timeLabel, group]) => (
          <div key={timeLabel}>
            <div className="text-xs uppercase tracking-widest text-gris-c mb-2">{timeLabel}</div>
            <div className="space-y-px">
              {group.map((s) => (
                <SeanceCard
                  key={s.id}
                  seance={s}
                  film={s.film}
                  selected={selectedIds.has(s.id)}
                  onToggle={handleToggle}
                  festivalId={id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
