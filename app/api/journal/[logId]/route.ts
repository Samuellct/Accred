import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { logs } from "@/lib/db/schema";

type Params = { params: Promise<{ logId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { logId } = await params;
  const id = Number(logId);
  const body = await req.json() as {
    rating?: number | null;
    text?: string | null;
    tags?: string[] | null;
    longCritique?: string | null;
    letterboxdExported?: number;
  };

  const existing = await db.query.logs.findFirst({ where: eq(logs.id, id) });
  if (!existing) {
    return NextResponse.json({ error: "Log introuvable" }, { status: 404 });
  }

  const updates: Partial<typeof logs.$inferInsert> = {};
  if ("rating" in body) updates.rating = body.rating ?? null;
  if ("text" in body) updates.text = body.text ?? null;
  if ("tags" in body) updates.tags = body.tags ? JSON.stringify(body.tags) : null;
  if ("longCritique" in body) updates.longCritique = body.longCritique ?? null;
  if ("letterboxdExported" in body) updates.letterboxdExported = body.letterboxdExported ?? 0;

  const [updated] = await db.update(logs).set(updates).where(eq(logs.id, id)).returning();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { logId } = await params;
  await db.delete(logs).where(eq(logs.id, Number(logId)));
  return new NextResponse(null, { status: 204 });
}
