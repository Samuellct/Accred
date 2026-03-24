"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { detectConflicts } from "@/lib/conflicts";
import type { SeanceWithFilm } from "@/lib/conflicts";
import ConflictAlert from "@/components/festival/ConflictAlert";
import Button from "@/components/ui/Button";

interface SelectionFull {
  id: number;
  seanceId: number;
  priority: string;
  createdAt: string;
  seance: {
    id: number;
    dateTime: string;
    venue: string | null;
    section: string | null;
    format: string | null;
  };
  film: {
    id: number;
    title: string;
    director: string | null;
    duration: number | null;
    posterPath: string | null;
  } | null;
}

const PRIORITY_LABELS: Record<string, string> = {
  high: "Haute",
  med: "Moyenne",
  low: "Basse",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-or border-or",
  med: "text-gris-c border-gris-c/50",
  low: "text-gris-c/50 border-gris-c/25",
};

function dateKey(dateTime: string): string {
  return dateTime.slice(0, 10);
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function formatTime(dateTime: string): string {
  const d = new Date(dateTime);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}h${m}`;
}

function toSeanceWithFilm(s: SelectionFull): SeanceWithFilm {
  return {
    id: s.seance.id,
    filmId: s.film?.id ?? null,
    dateTime: s.seance.dateTime,
    duration: s.film?.duration ?? null,
    filmTitle: s.film?.title ?? "Film inconnu",
    venue: s.seance.venue,
  };
}

const BUFFER_OPTIONS = [
  { value: 0, label: "Aucune" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
];

export default function SelectionPage() {
  const { id } = useParams<{ id: string }>();

  const [selections, setSelections] = useState<SelectionFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [bufferMinutes, setBufferMinutes] = useState(20);
  const [openPriority, setOpenPriority] = useState<number | null>(null); // selectionId
  const [conflictMap, setConflictMap] = useState<Map<number, boolean>>(new Map()); // seanceId -> en conflit
  const [swapConflicts, setSwapConflicts] = useState<{
    seanceId: number;
    conflicts: {
      existingSeanceId: number;
      existingFilmTitle: string;
      existingDateTime: string;
      existingVenue: string | null;
      type: "overlap" | "buffer";
      alternative: { seanceId: number; dateTime: string; venue: string | null } | null;
    }[];
  } | null>(null);

  async function loadSelections(buffer = bufferMinutes) {
    try {
      const [selectRes, bufRes] = await Promise.all([
        fetch(`/api/festivals/${id}/selections`),
        fetch("/api/settings?key=conflict_buffer_minutes"),
      ]);
      const data = await selectRes.json() as SelectionFull[];
      const bufData = await bufRes.json() as { value: string | null };
      const loadedBuffer = bufData.value ? parseInt(bufData.value, 10) : buffer;
      if (!isNaN(loadedBuffer)) setBufferMinutes(loadedBuffer);
      setSelections(data);
      computeConflicts(data, isNaN(loadedBuffer) ? buffer : loadedBuffer);
    } finally {
      setLoading(false);
    }
  }

  async function handleBufferChange(val: number) {
    setBufferMinutes(val);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "conflict_buffer_minutes", value: String(val) }),
    });
    computeConflicts(selections, val);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadSelections(); }, [id]);

  function computeConflicts(data: SelectionFull[], buffer = bufferMinutes) {
    const seancesData = data.map(toSeanceWithFilm);
    const conflicting = new Set<number>();

    for (const sel of data) {
      const seance = toSeanceWithFilm(sel);
      const others = seancesData.filter((s) => s.id !== seance.id);
      const c = detectConflicts(seance, others, buffer);
      if (c.length > 0) conflicting.add(seance.id);
    }

    setConflictMap(new Map(Array.from(conflicting).map((sid) => [sid, true])));
  }

  async function handleDelete(selectionId: number, seanceId: number) {
    await fetch(`/api/festivals/${id}/selections/${selectionId}`, { method: "DELETE" });
    setSelections((prev) => prev.filter((s) => s.id !== selectionId));
    setConflictMap((prev) => { const next = new Map(prev); next.delete(seanceId); return next; });
  }

  async function handlePriority(selectionId: number, priority: string) {
    const res = await fetch(`/api/festivals/${id}/selections/${selectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    if (res.ok) {
      setSelections((prev) =>
        prev.map((s) => s.id === selectionId ? { ...s, priority } : s)
      );
    }
    setOpenPriority(null);
  }

  async function handleSwap(oldSeanceId: number, newSeanceId: number) {
    // trouver et supprimer l'ancienne selection
    const oldSel = selections.find((s) => s.seance.id === oldSeanceId);
    if (oldSel) {
      await handleDelete(oldSel.id, oldSeanceId);
    }
    // ajouter la nouvelle
    await fetch(`/api/festivals/${id}/selections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seanceId: newSeanceId }),
    });
    setSwapConflicts(null);
    void loadSelections();
  }

  // grouper par jour
  const days = Array.from(new Set(selections.map((s) => dateKey(s.seance.dateTime)))).sort();
  const byDay = new Map<string, SelectionFull[]>();
  for (const day of days) {
    byDay.set(day, selections.filter((s) => dateKey(s.seance.dateTime) === day));
  }

  if (loading) {
    return <div className="px-4 py-6"><p className="text-gris-c text-sm">Chargement...</p></div>;
  }

  if (selections.length === 0) {
    return (
      <div className="px-4 py-6">
        <h2 className="font-serif text-2xl text-brun">Ma selection</h2>
        <p className="text-gris-c text-sm mt-4">Aucune seance selectionnee.</p>
        <a
          href="programme"
          className="inline-block mt-4 text-xs uppercase tracking-widest text-or hover:opacity-70 transition-opacity duration-[0.15s]"
        >
          Voir le programme →
        </a>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* entete avec export ICS */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <h2 className="font-serif text-2xl text-brun">Ma selection</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { window.location.href = `/api/festivals/${id}/selections/export.ics`; }}
        >
          Exporter ICS
        </Button>
      </div>

      {/* marge de deplacement */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-creme-f">
        <span className="text-xs text-gris-c uppercase tracking-widest flex-shrink-0">
          Marge deplacement
        </span>
        <div className="flex gap-1 flex-wrap">
          {BUFFER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => void handleBufferChange(opt.value)}
              className={`text-[0.6rem] uppercase tracking-widest px-2.5 py-1 border transition-colors duration-[0.15s] ${
                bufferMinutes === opt.value
                  ? "bg-or text-parchemin border-or"
                  : "text-gris-c border-or/25 hover:border-or hover:text-or"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* swap conflict alert */}
      {swapConflicts && (
        <div className="mb-4">
          <ConflictAlert
            conflicts={swapConflicts.conflicts}
            onSwap={(oldId, newId) => void handleSwap(oldId, newId)}
            onDismiss={() => setSwapConflicts(null)}
          />
        </div>
      )}

      {/* timeline par jour */}
      {Array.from(byDay.entries()).map(([day, daySels]) => (
        <div key={day} className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-gris-c mb-3 capitalize">
            {formatFullDate(day)}
          </h3>

          <div className="space-y-0">
            {daySels.map((sel) => {
              const isConflict = conflictMap.get(sel.seance.id) ?? false;
              return (
                <div key={sel.id} className="flex gap-0 mb-px">
                  {/* barre laterale statut */}
                  <div className={`w-1.5 flex-shrink-0 ${isConflict ? "bg-or-chaud" : "bg-or"}`} />

                  {/* contenu */}
                  <div className={`flex-1 border border-l-0 px-3 py-2.5 flex items-start justify-between gap-2 ${
                    isConflict ? "bg-or-chaud/5 border-or-chaud/40" : "bg-parchemin border-or/25"
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className={`font-medium text-sm tabular-nums ${isConflict ? "text-or-chaud" : "text-or"}`}>
                          {formatTime(sel.seance.dateTime)}
                        </span>
                        {isConflict && (
                          <span className="text-[0.6rem] uppercase tracking-widest text-or-chaud font-medium">
                            Conflit horaire
                          </span>
                        )}
                      </div>
                      <p className="font-serif text-brun text-sm leading-tight mt-0.5 truncate">
                        {sel.film?.title ?? "Film inconnu"}
                      </p>
                      {sel.seance.venue && (
                        <p className="text-gris-c text-xs mt-0.5">{sel.seance.venue}</p>
                      )}
                    </div>

                    {/* actions droite */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* badge priorite + dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenPriority(openPriority === sel.id ? null : sel.id)}
                          className={`text-[0.6rem] uppercase tracking-widest border px-1.5 py-0.5 transition-colors duration-[0.15s] ${PRIORITY_COLORS[sel.priority] ?? PRIORITY_COLORS.med}`}
                        >
                          {PRIORITY_LABELS[sel.priority] ?? sel.priority}
                        </button>
                        {openPriority === sel.id && (
                          <div className="absolute right-0 top-full mt-1 bg-parchemin border border-or/25 shadow-sm z-10 min-w-[80px]">
                            {(["high", "med", "low"] as const).map((p) => (
                              <button
                                key={p}
                                onClick={() => void handlePriority(sel.id, p)}
                                className={`block w-full text-left px-3 py-1.5 text-[0.6rem] uppercase tracking-widest hover:bg-creme transition-colors ${
                                  sel.priority === p ? "text-or" : "text-gris-c"
                                }`}
                              >
                                {PRIORITY_LABELS[p]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* supprimer */}
                      <button
                        onClick={() => void handleDelete(sel.id, sel.seance.id)}
                        aria-label="Retirer"
                        className="text-gris-c hover:text-brun transition-colors duration-[0.15s]"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* compteur */}
      <p className="text-gris-c text-xs text-right mt-2">
        {selections.length} seance{selections.length > 1 ? "s" : ""} selectionnee{selections.length > 1 ? "s" : ""}
      </p>
    </div>
  );
}
