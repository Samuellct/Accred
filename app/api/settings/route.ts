import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key requis" }, { status: 400 });
  }
  const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  return NextResponse.json({ key, value: row?.value ?? null });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { key: string; value: string };
  const { key, value } = body;
  if (!key) {
    return NextResponse.json({ error: "key requis" }, { status: 400 });
  }
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
  return NextResponse.json({ key, value });
}
