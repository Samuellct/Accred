"use client";

import Link from "next/link";

interface Film {
  id: number;
  title: string;
  duration: number | null;
}

interface Seance {
  id: number;
  dateTime: string;
  venue: string | null;
  film: Film | null;
}

interface Props {
  seances: Seance[];
  selectedIds: Set<number>;
  onToggle: (seanceId: number) => void;
  festivalId: string | number;
}

// la grille couvre de 8h a 24h, par tranches de 30min
const GRID_START_H = 8;
const GRID_END_H = 24;
const SLOT_MIN = 30;
const TOTAL_SLOTS = ((GRID_END_H - GRID_START_H) * 60) / SLOT_MIN; // 32 slots

const DEFAULT_DURATION = 120;

function minutesSinceGridStart(dateTime: string): number {
  const d = new Date(dateTime);
  const totalMin = d.getHours() * 60 + d.getMinutes();
  return totalMin - GRID_START_H * 60;
}


export default function ProgrammeGrid({ seances, selectedIds, onToggle, festivalId }: Props) {
  // salles uniques (X axis)
  const venues = Array.from(new Set(seances.map((s) => s.venue ?? "Autre"))).sort();
  if (venues.length === 0) return null;

  // labels heures pour l'axe Y (une ligne par slot)
  const timeLabels: string[] = [];
  for (let i = 0; i <= TOTAL_SLOTS; i++) {
    const totalMin = GRID_START_H * 60 + i * SLOT_MIN;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    timeLabels.push(`${h}h${m > 0 ? m.toString().padStart(2, "0") : ""}`);
  }

  return (
    <div className="hidden md:flex overflow-x-auto">
      {/* axe heures */}
      <div className="flex-shrink-0 w-14 pt-8">
        {timeLabels.map((label, i) => (
          <div
            key={i}
            style={{ height: `${SLOT_MIN * 2}px` }} // 2px par minute
            className="flex items-start px-2"
          >
            <span className="text-[0.6rem] text-gris-c tabular-nums">{label}</span>
          </div>
        ))}
      </div>

      {/* colonnes salles */}
      <div
        className="flex-1 grid border-l border-creme-f"
        style={{ gridTemplateColumns: `repeat(${venues.length}, minmax(140px, 1fr))` }}
      >
        {/* headers salles */}
        {venues.map((venue) => (
          <div key={venue} className="border-r border-creme-f px-2 py-2 bg-parchemin sticky top-0 z-10">
            <span className="text-xs text-brun font-medium truncate block">{venue}</span>
          </div>
        ))}

        {/* colonnes contenu */}
        {venues.map((venue) => {
          const colSeances = seances.filter((s) => (s.venue ?? "Autre") === venue);
          return (
            <div
              key={venue}
              className="relative border-r border-creme-f"
              style={{ height: `${TOTAL_SLOTS * SLOT_MIN * 2}px` }} // 2px par minute
            >
              {/* lignes grille fond */}
              {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-creme-f/50"
                  style={{ top: `${i * SLOT_MIN * 2}px` }}
                />
              ))}

              {/* blocs seances */}
              {colSeances.map((s) => {
                const startMin = minutesSinceGridStart(s.dateTime);
                const dur = s.film?.duration ?? DEFAULT_DURATION;
                const topPx = Math.max(0, startMin * 2);
                const heightPx = Math.max(24, dur * 2);
                const isSelected = selectedIds.has(s.id);

                return (
                  <div
                    key={s.id}
                    className={`absolute left-1 right-1 overflow-hidden cursor-pointer transition-colors duration-[0.15s] ${
                      isSelected
                        ? "bg-or/15 border border-or"
                        : "bg-parchemin border border-or/30 hover:border-or"
                    }`}
                    style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                    onClick={() => onToggle(s.id)}
                  >
                    <div className="px-1.5 py-1">
                      {s.film ? (
                        <Link
                          href={`/festivals/${festivalId}/films/${s.film.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block text-[0.6rem] font-serif text-brun leading-tight line-clamp-2 hover:text-or transition-colors"
                        >
                          {s.film.title}
                        </Link>
                      ) : (
                        <span className="block text-[0.6rem] text-gris-c">Film inconnu</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
