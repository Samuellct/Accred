import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { selections, seances, films } from "@/lib/db/schema";
import { generateICS } from "@/lib/ics";
import type { ICSEvent } from "@/lib/ics";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const festivalId = Number(id);

  const rows = await db
    .select({
      seanceId: seances.id,
      dateTime: seances.dateTime,
      venue: seances.venue,
      section: seances.section,
      format: seances.format,
      filmTitle: films.title,
      duration: films.duration,
    })
    .from(selections)
    .innerJoin(seances, eq(selections.seanceId, seances.id))
    .leftJoin(films, eq(seances.filmId, films.id))
    .where(eq(seances.festivalId, festivalId))
    .orderBy(seances.dateTime);

  const events: ICSEvent[] = rows.map((r) => ({
    seanceId: r.seanceId,
    filmTitle: r.filmTitle ?? "Film",
    dateTime: r.dateTime,
    duration: r.duration,
    venue: r.venue,
    section: r.section,
    format: r.format,
  }));

  const icsContent = generateICS(events);

  return new Response(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="accred-selections.ics"',
    },
  });
}
