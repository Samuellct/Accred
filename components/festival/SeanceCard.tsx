"use client";

import Link from "next/link";
import Image from "next/image";

interface SeanceInfo {
  id: number;
  dateTime: string;
  venue: string | null;
  section: string | null;
  format: string | null;
}

interface FilmInfo {
  id: number;
  title: string;
  director: string | null;
  duration: number | null;
  posterPath: string | null;
}

interface Props {
  seance: SeanceInfo;
  film: FilmInfo | null;
  selected: boolean;
  onToggle: (seanceId: number) => void;
  festivalId: string | number;
}

function formatTime(dateTime: string): string {
  const d = new Date(dateTime);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}h${m}`;
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, "0") : ""}` : `${m}min`;
}

export default function SeanceCard({ seance, film, selected, onToggle, festivalId }: Props) {
  const time = formatTime(seance.dateTime);
  const dur = film ? formatDuration(film.duration) : null;

  return (
    <div className="flex items-stretch bg-parchemin border border-or/25 shadow-sm overflow-hidden">
      {/* mini poster — hauteur explicite requise pour next/image fill */}
      <div className="w-12 flex-shrink-0 bg-noir/10 relative" style={{ minHeight: "72px" }}>
        {film?.posterPath ? (
          <Image
            src={film.posterPath}
            alt={film.title}
            fill
            unoptimized
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-noir/5">
            <span className="text-gris-c text-[0.55rem]">?</span>
          </div>
        )}
      </div>

      {/* infos */}
      <div className="flex-1 px-3 py-2.5 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-or font-medium text-sm tabular-nums">{time}</span>
          {seance.section && (
            <span className="text-gris-c text-[0.6rem] uppercase tracking-widest truncate">
              {seance.section}
            </span>
          )}
        </div>
        {film ? (
          <Link
            href={`/festivals/${festivalId}/films/${film.id}`}
            className="block font-serif text-brun text-sm leading-tight mt-0.5 hover:text-or transition-colors duration-[0.15s] truncate"
          >
            {film.title}
          </Link>
        ) : (
          <span className="block font-serif text-brun text-sm leading-tight mt-0.5 truncate">
            Film inconnu
          </span>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          {seance.venue && (
            <span className="text-gris-c text-xs truncate">{seance.venue}</span>
          )}
          {dur && (
            <span className="text-gris-c text-xs flex-shrink-0">{dur}</span>
          )}
        </div>
      </div>

      {/* bouton selection */}
      <button
        onClick={() => onToggle(seance.id)}
        aria-label={selected ? "Retirer de la selection" : "Ajouter a la selection"}
        className={`w-10 flex-shrink-0 flex items-center justify-center transition-colors duration-[0.15s] ${
          selected
            ? "bg-or text-parchemin"
            : "text-or border-l border-or/25 hover:bg-or/10"
        }`}
      >
        {selected ? (
          // checkmark
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          // plus
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </button>
    </div>
  );
}
