export interface LetterboxdLog {
  id: number;
  filmTitle: string;
  filmYear: number | null;
  director: string | null;
  rating: number | null;
  seenAt: string | null;
  tags: string | null; // JSON array
  longCritique: string | null;
  letterboxdExported: number;
}

// RFC 4180 : entourer de guillemets si virgule, newline ou guillemet
function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes("\n") || val.includes('"')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function parseTags(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json) as string[]; } catch { return []; }
}

export function generateLetterboxdCSV(logs: LetterboxdLog[]): { csv: string; exportedIds: number[] } {
  const header = "Title,Year,Directors,Rating10,WatchedDate,Rewatch,Tags,Review";

  const toExport = logs.filter((l) => l.letterboxdExported !== 1);
  const exportedIds = toExport.map((l) => l.id);

  const rows = toExport.map((l) => {
    const title = escapeCSV(l.filmTitle);
    const year = l.filmYear != null ? String(l.filmYear) : "";
    const directors = l.director ? escapeCSV(l.director) : "";
    const rating10 = l.rating != null ? String(Math.round(l.rating * 2)) : "";
    const watchedDate = l.seenAt ?? "";
    const rewatch = "";
    const tags = escapeCSV(parseTags(l.tags).join(", "));
    const review = l.longCritique ? escapeCSV(l.longCritique) : "";
    return [title, year, directors, rating10, watchedDate, rewatch, tags, review].join(",");
  });

  const csv = [header, ...rows].join("\n");
  return { csv, exportedIds };
}
