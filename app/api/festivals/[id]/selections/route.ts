import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { selections, seances, films, settings } from "@/lib/db/schema";
import { detectConflicts, suggestAlternative } from "@/lib/conflicts";
import type { SeanceWithFilm } from "@/lib/conflicts";

type Params = { params: Promise<{ id: string }> };

// helper pour lire le buffer conflits depuis les settings
async function getBufferMinutes(): Promise<number> {
  const row = await db.query.settings.findFirst({
    where: eq(settings.key, "conflict_buffer_minutes"),
  });
  const parsed = row?.value ? parseInt(row.value, 10) : NaN;
  return isNaN(parsed) ? 20 : parsed;
}

// helper pour fetcher toutes les seances du festival avec infos film
async function getSeancesWithFilm(festivalId: number): Promise<SeanceWithFilm[]> {
  const rows = await db
    .select({
      id: seances.id,
      filmId: seances.filmId,
      dateTime: seances.dateTime,
      venue: seances.venue,
      duration: films.duration,
      filmTitle: films.title,
    })
    .from(seances)
    .leftJoin(films, eq(seances.filmId, films.id))
    .where(eq(seances.festivalId, festivalId));

  return rows.map((r) => ({
    id: r.id,
    filmId: r.filmId,
    dateTime: r.dateTime,
    venue: r.venue,
    duration: r.duration,
    filmTitle: r.filmTitle ?? "Film inconnu",
  }));
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const festivalId = Number(id);

  const rows = await db
    .select({
      id: selections.id,
      seanceId: selections.seanceId,
      priority: selections.priority,
      createdAt: selections.createdAt,
      seance: {
        id: seances.id,
        dateTime: seances.dateTime,
        venue: seances.venue,
        section: seances.section,
        format: seances.format,
      },
      film: {
        id: films.id,
        title: films.title,
        director: films.director,
        duration: films.duration,
        posterPath: films.posterPath,
        genres: films.genres,
        countries: films.countries,
        year: films.year,
      },
    })
    .from(selections)
    .innerJoin(seances, eq(selections.seanceId, seances.id))
    .leftJoin(films, eq(seances.filmId, films.id))
    .where(eq(seances.festivalId, festivalId))
    .orderBy(seances.dateTime);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const festivalId = Number(id);
  const body = await req.json() as { seanceId: number; priority?: string };
  const { seanceId, priority = "med" } = body;

  if (!seanceId) {
    return NextResponse.json({ error: "seanceId requis" }, { status: 400 });
  }

  // verifier que la seance existe et appartient au festival
  const seance = await db.query.seances.findFirst({
    where: and(eq(seances.id, seanceId), eq(seances.festivalId, festivalId)),
  });
  if (!seance) {
    return NextResponse.json({ error: "Seance introuvable" }, { status: 404 });
  }

  // inserer la selection
  let selection;
  try {
    const [inserted] = await db
      .insert(selections)
      .values({ seanceId, priority })
      .returning();
    selection = inserted;
  } catch (err: unknown) {
    // unique constraint: deja selectionnee
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Deja selectionnee" }, { status: 409 });
    }
    throw err;
  }

  // detection conflits
  const bufferMinutes = await getBufferMinutes();
  const allSeancesWithFilm = await getSeancesWithFilm(festivalId);

  // seances actuellement selectionnees (hors la nouvelle)
  const currentSelections = await db
    .select({ seanceId: selections.seanceId })
    .from(selections)
    .innerJoin(seances, eq(selections.seanceId, seances.id))
    .where(and(eq(seances.festivalId, festivalId), eq(selections.seanceId, seanceId)));
  // on prend toutes les selections sauf la nouvelle pour detecter les conflits
  const otherSelections = await db
    .select({ seanceId: selections.seanceId })
    .from(selections)
    .innerJoin(seances, eq(selections.seanceId, seances.id))
    .where(eq(seances.festivalId, festivalId));

  const selectedSeanceIds = new Set(otherSelections.map((s) => s.seanceId));
  selectedSeanceIds.delete(seanceId); // exclure la nouvelle

  const selectedSeancesData = allSeancesWithFilm.filter((s) => selectedSeanceIds.has(s.id));
  const newSeanceData = allSeancesWithFilm.find((s) => s.id === seanceId);

  let conflictsWithAlts: unknown[] = [];
  if (newSeanceData) {
    const conflictList = detectConflicts(newSeanceData, selectedSeancesData, bufferMinutes);
    conflictsWithAlts = conflictList.map((c) => {
      const alt = suggestAlternative(
        newSeanceData.filmId,
        allSeancesWithFilm,
        selectedSeancesData,
        seanceId,
        bufferMinutes
      );
      return { ...c, alternative: alt };
    });
    void currentSelections;
  }

  return NextResponse.json({ selection, conflicts: conflictsWithAlts }, { status: 201 });
}
