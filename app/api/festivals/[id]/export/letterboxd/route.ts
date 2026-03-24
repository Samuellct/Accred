import { NextRequest } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { logs, films } from "@/lib/db/schema";
import { generateLetterboxdCSV } from "@/lib/letterboxd";
import type { LetterboxdLog } from "@/lib/letterboxd";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const festivalId = Number(id);

  const rows = await db
    .select({
      id: logs.id,
      rating: logs.rating,
      seenAt: logs.seenAt,
      tags: logs.tags,
      longCritique: logs.longCritique,
      letterboxdExported: logs.letterboxdExported,
      filmTitle: films.title,
      filmYear: films.year,
      director: films.director,
    })
    .from(logs)
    .leftJoin(films, eq(logs.filmId, films.id))
    .where(eq(logs.festivalId, festivalId));

  const mapped: LetterboxdLog[] = rows.map((r) => ({
    id: r.id,
    filmTitle: r.filmTitle ?? "Film inconnu",
    filmYear: r.filmYear ?? null,
    director: r.director ?? null,
    rating: r.rating ?? null,
    seenAt: r.seenAt ?? null,
    tags: r.tags ?? null,
    longCritique: r.longCritique ?? null,
    letterboxdExported: r.letterboxdExported ?? 0,
  }));

  const { csv, exportedIds } = generateLetterboxdCSV(mapped);

  // marquer les logs exportes
  if (exportedIds.length > 0) {
    await db
      .update(logs)
      .set({ letterboxdExported: 1 })
      .where(inArray(logs.id, exportedIds));
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="accred-letterboxd.csv"',
    },
  });
}
