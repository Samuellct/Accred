// detection conflits horaires entre seances selectionnees

export interface SeanceWithFilm {
  id: number;
  filmId: number | null;
  dateTime: string; // ISO, ex: "2026-05-13T10:00"
  duration: number | null; // minutes
  filmTitle: string;
  venue: string | null;
}

export interface Conflict {
  existingSeanceId: number;
  existingFilmTitle: string;
  existingDateTime: string;
  existingVenue: string | null;
  type: "overlap" | "buffer";
}

export interface Alternative {
  seanceId: number;
  dateTime: string;
  venue: string | null;
}

// duree par defaut si inconnue (2h = safe pour la plupart des films)
const DEFAULT_DURATION = 120;

function toMinutes(dateTime: string): number {
  return new Date(dateTime).getTime() / 60000;
}

export function detectConflicts(
  newSeance: SeanceWithFilm,
  selectedSeances: SeanceWithFilm[],
  bufferMinutes = 20
): Conflict[] {
  const conflicts: Conflict[] = [];
  const newStart = toMinutes(newSeance.dateTime);
  const newDur = newSeance.duration ?? DEFAULT_DURATION;
  const newEnd = newStart + newDur;

  for (const s of selectedSeances) {
    if (s.id === newSeance.id) continue;
    const sStart = toMinutes(s.dateTime);
    const sDur = s.duration ?? DEFAULT_DURATION;
    const sEnd = sStart + sDur;

    // chevauchement reel (sans buffer)
    const hardOverlap = newStart < sEnd && sStart < newEnd;
    // chevauchement avec buffer
    const softOverlap = newStart < sEnd + bufferMinutes && sStart < newEnd + bufferMinutes;

    if (hardOverlap) {
      conflicts.push({
        existingSeanceId: s.id,
        existingFilmTitle: s.filmTitle,
        existingDateTime: s.dateTime,
        existingVenue: s.venue,
        type: "overlap",
      });
    } else if (softOverlap) {
      conflicts.push({
        existingSeanceId: s.id,
        existingFilmTitle: s.filmTitle,
        existingDateTime: s.dateTime,
        existingVenue: s.venue,
        type: "buffer",
      });
    }
  }

  return conflicts;
}

export function suggestAlternative(
  filmId: number | null,
  allSeances: SeanceWithFilm[],
  selectedSeances: SeanceWithFilm[],
  excludeSeanceId: number,
  bufferMinutes = 20
): Alternative | null {
  if (!filmId) return null;

  // autres seances du meme film, pas celle exclue, pas deja selectionnee
  const selectedIds = new Set(selectedSeances.map((s) => s.id));
  const candidates = allSeances.filter(
    (s) =>
      s.filmId === filmId &&
      s.id !== excludeSeanceId &&
      !selectedIds.has(s.id)
  );

  for (const candidate of candidates) {
    const conflicts = detectConflicts(candidate, selectedSeances, bufferMinutes);
    if (conflicts.length === 0) {
      return { seanceId: candidate.id, dateTime: candidate.dateTime, venue: candidate.venue };
    }
  }

  return null;
}
