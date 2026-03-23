import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { festivals } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const festival = await db.query.festivals.findFirst({
    where: eq(festivals.id, Number(id)),
  });
  if (!festival) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(festival);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { name, location, edition, startDate, endDate, status } = body;

  const existing = await db.query.festivals.findFirst({
    where: eq(festivals.id, Number(id)),
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const updates: Partial<typeof existing> = {};
  if (name !== undefined) updates.name = name;
  if (location !== undefined) updates.location = location;
  if (edition !== undefined) updates.edition = edition;
  if (startDate !== undefined) updates.startDate = startDate;
  if (endDate !== undefined) updates.endDate = endDate;
  if (status !== undefined) updates.status = status;

  const [updated] = await db
    .update(festivals)
    .set(updates)
    .where(eq(festivals.id, Number(id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await db.query.festivals.findFirst({
    where: eq(festivals.id, Number(id)),
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await db.delete(festivals).where(eq(festivals.id, Number(id)));
  return new NextResponse(null, { status: 204 });
}
