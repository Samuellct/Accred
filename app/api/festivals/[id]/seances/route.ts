import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { seances, films } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const festivalId = Number(id);
  const dateFilter = req.nextUrl.searchParams.get("date");

  const conditions = [eq(seances.festivalId, festivalId)];
  if (dateFilter) {
    // dateTime stocke en ISO, on filtre sur le prefixe YYYY-MM-DD
    conditions.push(sql`date(${seances.dateTime}) = ${dateFilter}`);
  }

  const rows = await db
    .select({
      id: seances.id,
      festivalId: seances.festivalId,
      filmId: seances.filmId,
      dateTime: seances.dateTime,
      venue: seances.venue,
      section: seances.section,
      format: seances.format,
      notes: seances.notes,
      createdAt: seances.createdAt,
      film: {
        id: films.id,
        title: films.title,
        originalTitle: films.originalTitle,
        director: films.director,
        year: films.year,
        duration: films.duration,
        posterPath: films.posterPath,
        tmdbId: films.tmdbId,
      },
    })
    .from(seances)
    .leftJoin(films, eq(seances.filmId, films.id))
    .where(and(...conditions))
    .orderBy(seances.dateTime);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const festivalId = Number(id);
  const body = await req.json();
  const { filmTitle, dateTime, venue, section, format, notes, duration } = body;

  if (!filmTitle || !dateTime) {
    return NextResponse.json(
      { error: "filmTitle et dateTime sont requis" },
      { status: 400 }
    );
  }

  // find ou create le film
  let film = await db.query.films.findFirst({
    where: sql`LOWER(${films.title}) = LOWER(${filmTitle})`,
  });

  if (!film) {
    const [created] = await db
      .insert(films)
      .values({ title: filmTitle, duration: duration ?? null })
      .returning();
    film = created;
  }

  const [seance] = await db
    .insert(seances)
    .values({ festivalId, filmId: film.id, dateTime, venue, section, format, notes })
    .returning();

  return NextResponse.json({ ...seance, film }, { status: 201 });
}
