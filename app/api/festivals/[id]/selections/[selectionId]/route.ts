import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { selections } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string; selectionId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { selectionId } = await params;
  await db.delete(selections).where(eq(selections.id, Number(selectionId)));
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { selectionId } = await params;
  const body = await req.json() as { priority: string };
  const { priority } = body;

  const validPriorities = ["high", "med", "low"];
  if (!priority || !validPriorities.includes(priority)) {
    return NextResponse.json({ error: "Priorite invalide (high|med|low)" }, { status: 400 });
  }

  const [updated] = await db
    .update(selections)
    .set({ priority })
    .where(eq(selections.id, Number(selectionId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Selection introuvable" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
