import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { festivals } from "@/lib/db/schema";

export async function GET() {
  const rows = await db.query.festivals.findMany({
    orderBy: [desc(festivals.startDate)],
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, location, edition, startDate, endDate, status } = body;

  if (!name || !startDate || !endDate) {
    return NextResponse.json(
      { error: "name, startDate et endDate sont requis" },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(festivals)
    .values({ name, location, edition, startDate, endDate, status: status ?? "upcoming" })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
