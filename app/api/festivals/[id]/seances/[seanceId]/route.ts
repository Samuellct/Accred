import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seances } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string; seanceId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { seanceId } = await params;
  const seance = await db.query.seances.findFirst({
    where: eq(seances.id, Number(seanceId)),
  });
  if (!seance) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(seance);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { seanceId } = await params;
  const body = await req.json();
  const { dateTime, venue, section, format, notes, filmId } = body;

  const existing = await db.query.seances.findFirst({
    where: eq(seances.id, Number(seanceId)),
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const updates: Partial<typeof existing> = {};
  if (dateTime !== undefined) updates.dateTime = dateTime;
  if (venue !== undefined) updates.venue = venue;
  if (section !== undefined) updates.section = section;
  if (format !== undefined) updates.format = format;
  if (notes !== undefined) updates.notes = notes;
  if (filmId !== undefined) updates.filmId = filmId;

  const [updated] = await db
    .update(seances)
    .set(updates)
    .where(eq(seances.id, Number(seanceId)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { seanceId } = await params;
  const existing = await db.query.seances.findFirst({
    where: eq(seances.id, Number(seanceId)),
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await db.delete(seances).where(eq(seances.id, Number(seanceId)));
  return new NextResponse(null, { status: 204 });
}
