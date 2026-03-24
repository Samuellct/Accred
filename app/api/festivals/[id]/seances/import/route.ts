import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { seances, films } from "@/lib/db/schema";
import type { SeanceRow } from "@/lib/importers/types";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const festivalId = Number(id);
  const body = await req.json() as { rows: SeanceRow[]; source: "csv" | "json" };

  if (!body.rows || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: "rows manquant" }, { status: 400 });
  }

  let imported = 0;
  let filmsCreated = 0;
  const errors: { line: number; message: string }[] = [];

  // transaction pour tout ou rien en cas d'erreur critique
  // note : sqlite3 sync, drizzle n'a pas de transaction async native pour better-sqlite3
  // on fait des inserts sequentiels et on collecte les erreurs
  for (let i = 0; i < body.rows.length; i++) {
    const row = body.rows[i];
    const line = i + 1;

    try {
      // find ou create film par titre (case-insensitive)
      // on cherche aussi dans originalTitle car TMDb peut avoir change le titre principal en fr
      let film = await db.query.films.findFirst({
        where: sql`LOWER(${films.title}) = LOWER(${row.titre}) OR LOWER(COALESCE(${films.originalTitle}, '')) = LOWER(${row.titre})`,
      });

      if (!film) {
        const [created] = await db
          .insert(films)
          .values({ title: row.titre, duration: row.duree ?? null })
          .returning();
        film = created;
        filmsCreated++;
      }

      const dateTime = `${row.date}T${row.heure}`;
      await db.insert(seances).values({
        festivalId,
        filmId: film.id,
        dateTime,
        venue: row.salle ?? null,
        section: row.section ?? null,
        format: row.format ?? null,
        notes: row.notes ?? null,
      });

      imported++;
    } catch (err) {
      errors.push({ line, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ imported, filmsCreated, errors }, { status: 201 });
}
