import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { logs, films } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const festivalId = Number(id);

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
        originalTitle: films.originalTitle,
        director: films.director,
        year: films.year,
        posterPath: films.posterPath,
        duration: films.duration,
        genres: films.genres,
        countries: films.countries,
      },
    })
    .from(logs)
    .leftJoin(films, eq(logs.filmId, films.id))
    .where(eq(logs.festivalId, festivalId))
    .orderBy(logs.seenAt);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const festivalId = Number(id);
  const body = await req.json() as {
    filmId: number;
    rating?: number;
    text?: string;
    longCritique?: string;
    tags?: string[];
    seenAt?: string;
  };

  const { filmId, rating, text, longCritique, tags, seenAt } = body;

  if (!filmId) {
    return NextResponse.json({ error: "filmId requis" }, { status: 400 });
  }

  const film = await db.query.films.findFirst({ where: eq(films.id, filmId) });
  if (!film) {
    return NextResponse.json({ error: "Film introuvable" }, { status: 404 });
  }

  const [log] = await db
    .insert(logs)
    .values({
      filmId,
      festivalId,
      rating: rating ?? null,
      text: text ?? null,
      longCritique: longCritique ?? null,
      tags: tags ? JSON.stringify(tags) : null,
      seenAt: seenAt ?? null,
    })
    .returning();

  return NextResponse.json(log, { status: 201 });
}
