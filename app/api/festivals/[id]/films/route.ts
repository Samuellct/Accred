import { NextRequest, NextResponse } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { seances, films } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const festivalId = Number(id);
  const unmatchedOnly = req.nextUrl.searchParams.get("unmatched") === "true";

  // films lies a ce festival via les seances
  const rows = await db
    .selectDistinct({
      id: films.id,
      title: films.title,
      originalTitle: films.originalTitle,
      director: films.director,
      year: films.year,
      duration: films.duration,
      posterPath: films.posterPath,
      tmdbId: films.tmdbId,
      imdbId: films.imdbId,
    })
    .from(seances)
    .innerJoin(films, eq(seances.filmId, films.id))
    .where(
      unmatchedOnly
        ? and(eq(seances.festivalId, festivalId), isNull(films.tmdbId))
        : eq(seances.festivalId, festivalId)
    )
    .orderBy(films.title);

  return NextResponse.json(rows);
}
