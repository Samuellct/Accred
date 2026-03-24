import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { films, seances, selections } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string; filmId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id, filmId } = await params;
  const festivalId = Number(id);
  const filmIdNum = Number(filmId);

  const film = await db.query.films.findFirst({
    where: eq(films.id, filmIdNum),
  });

  if (!film) {
    return NextResponse.json({ error: "Film introuvable" }, { status: 404 });
  }

  const filmSeances = await db
    .select({
      id: seances.id,
      dateTime: seances.dateTime,
      venue: seances.venue,
      section: seances.section,
      format: seances.format,
    })
    .from(seances)
    .where(and(eq(seances.festivalId, festivalId), eq(seances.filmId, filmIdNum)))
    .orderBy(seances.dateTime);

  // selections pour ces seances
  const selRows = filmSeances.length > 0
    ? await db
        .select({ seanceId: selections.seanceId, selectionId: selections.id })
        .from(selections)
        .innerJoin(seances, eq(selections.seanceId, seances.id))
        .where(and(eq(seances.festivalId, festivalId), eq(seances.filmId, filmIdNum)))
    : [];

  const selectedIds = new Set(selRows.map((s) => s.seanceId));
  const selIdMap = new Map(selRows.map((s) => [s.seanceId, s.selectionId]));

  const seancesWithSelection = filmSeances.map((s) => ({
    ...s,
    selected: selectedIds.has(s.id),
    selectionId: selIdMap.get(s.id) ?? null,
  }));

  return NextResponse.json({ film, seances: seancesWithSelection });
}
