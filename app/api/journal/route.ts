import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, like, gte, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { logs, films, festivals } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const festivalId = searchParams.get("festivalId");
  const year = searchParams.get("year");
  const ratingMin = searchParams.get("ratingMin");

  const conditions = [];

  if (q.length >= 2) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        like(films.title, pattern),
        like(films.originalTitle, pattern),
        like(films.director, pattern),
        like(logs.text, pattern),
        like(logs.longCritique, pattern),
      )
    );
  }

  if (festivalId) {
    conditions.push(eq(logs.festivalId, Number(festivalId)));
  }

  if (year) {
    conditions.push(like(logs.seenAt, `${year}%`));
  }

  if (ratingMin) {
    conditions.push(gte(logs.rating, Number(ratingMin)));
  }

  const rows = await db
    .select({
      id: logs.id,
      filmId: logs.filmId,
      festivalId: logs.festivalId,
      rating: logs.rating,
      text: logs.text,
      longCritique: logs.longCritique,
      letterboxdExported: logs.letterboxdExported,
      tags: logs.tags,
      seenAt: logs.seenAt,
      createdAt: logs.createdAt,
      film: {
        id: films.id,
        title: films.title,
        director: films.director,
        posterPath: films.posterPath,
        duration: films.duration,
        year: films.year,
      },
      festival: {
        id: festivals.id,
        name: festivals.name,
      },
    })
    .from(logs)
    .leftJoin(films, eq(logs.filmId, films.id))
    .leftJoin(festivals, eq(logs.festivalId, festivals.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(logs.seenAt));

  return NextResponse.json(rows);
}
