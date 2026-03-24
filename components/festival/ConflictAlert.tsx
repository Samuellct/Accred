"use client";

interface ConflictItem {
  existingSeanceId: number;
  existingFilmTitle: string;
  existingDateTime: string;
  existingVenue: string | null;
  type: "overlap" | "buffer";
  alternative: {
    seanceId: number;
    dateTime: string;
    venue: string | null;
  } | null;
}

interface Props {
  conflicts: ConflictItem[];
  onSwap: (oldSeanceId: number, newSeanceId: number) => void;
  onDismiss: () => void;
}

function formatTime(dateTime: string): string {
  const d = new Date(dateTime);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}h${m}`;
}

export default function ConflictAlert({ conflicts, onSwap, onDismiss }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <div className="bg-parchemin border-l-2 border-or-chaud border border-or/25 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {conflicts.map((c, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="text-brun text-sm">
                {c.type === "overlap" ? "Chevauchement" : "Battement insuffisant"} avec{" "}
                <span className="font-medium">{c.existingFilmTitle}</span>
                {" a "}
                <span className="text-or">{formatTime(c.existingDateTime)}</span>
                {c.existingVenue ? ` — ${c.existingVenue}` : ""}
              </p>
              {c.alternative && (
                <p className="text-xs text-gris-c mt-1 flex items-center gap-2">
                  <span>
                    Autre seance disponible :{" "}
                    {formatTime(c.alternative.dateTime)}
                    {c.alternative.venue ? ` — ${c.alternative.venue}` : ""}
                  </span>
                  <button
                    onClick={() => onSwap(c.existingSeanceId, c.alternative!.seanceId)}
                    className="text-or text-xs uppercase tracking-widest hover:opacity-70 transition-opacity duration-[0.15s] flex-shrink-0"
                  >
                    Remplacer
                  </button>
                </p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Fermer"
          className="text-gris-c hover:text-brun transition-colors duration-[0.15s] flex-shrink-0 mt-0.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
