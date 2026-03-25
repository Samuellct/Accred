"use client";

import Image from "next/image";
import RatingStars from "./RatingStars";
import { formatRating } from "@/lib/journal";

interface LogCardEntry {
  id: number;
  rating: number | null;
  text: string | null;
  longCritique: string | null;
  letterboxdExported: number;
  tags: string | null;
  film: {
    title: string;
    director: string | null;
    posterPath: string | null;
  } | null;
}

interface Props {
  entry: LogCardEntry;
  festivalName?: string;
  onClick?: () => void;
}

function parseTags(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json) as string[]; } catch { return []; }
}

export default function LogCard({ entry, festivalName, onClick }: Props) {
  const tags = parseTags(entry.tags);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 bg-parchemin border border-or/25 px-3 py-2.5 text-left hover:bg-creme transition-colors duration-[0.15s]"
    >
      {/* poster */}
      <div className="relative w-10 flex-shrink-0" style={{ height: "56px" }}>
        {entry.film?.posterPath ? (
          <Image
            src={entry.film.posterPath}
            alt={entry.film.title ?? ""}
            fill
            unoptimized
            className="object-cover"
            sizes="40px"
          />
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
        {festivalName && (
          <p className="text-gris-c text-[0.55rem] uppercase tracking-widest mt-0.5">{festivalName}</p>
        )}
        {entry.rating !== null && (
          <div className="mt-1">
            <RatingStars value={entry.rating} readOnly size="sm" />
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {tags.map((t) => (
              <span key={t} className="text-[0.55rem] text-gris-c border border-creme-f px-1.5 py-0.5">
                #{t}
              </span>
            ))}
          </div>
        )}
        {entry.text && (
          <p className="text-brun text-xs mt-1.5 leading-relaxed line-clamp-2">{entry.text}</p>
        )}
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
}
