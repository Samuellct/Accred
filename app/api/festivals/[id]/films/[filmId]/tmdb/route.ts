import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { films } from "@/lib/db/schema";
import { getFilmDetails, downloadPoster } from "@/lib/tmdb";

type Params = { params: Promise<{ id: string; filmId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { filmId } = await params;
  const body = await req.json() as { tmdbId: number };

  if (!body.tmdbId) {
    return NextResponse.json({ error: "tmdbId requis" }, { status: 400 });
  }

  const existing = await db.query.films.findFirst({
    where: eq(films.id, Number(filmId)),
  });
  if (!existing) return NextResponse.json({ error: "Film introuvable" }, { status: 404 });

  let details;
  try {
    details = await getFilmDetails(body.tmdbId);
  } catch (err) {
    return NextResponse.json(
      { error: `Erreur TMDb : ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  // telecharge le poster si disponible
  let posterPath: string | null = null;
  if (details.posterPath) {
    try {
      posterPath = await downloadPoster(details.posterPath, Number(filmId));
    } catch {
      // poster optionnel, on continue sans
    }
  }

  const [updated] = await db
    .update(films)
    .set({
      tmdbId: details.tmdbId,
      title: details.title,
      originalTitle: details.originalTitle,
      director: details.director,
      year: details.year,
      duration: details.duration,
      genres: details.genres.length ? JSON.stringify(details.genres) : null,
      countries: details.countries.length ? JSON.stringify(details.countries) : null,
      synopsis: details.synopsis,
      posterPath,
      imdbId: details.imdbId,
    })
    .where(eq(films.id, Number(filmId)))
    .returning();

  return NextResponse.json(updated);
}
