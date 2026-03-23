import "dotenv/config";
import { hash } from "bcryptjs";
import { db } from "./index";
import { users, festivals } from "./schema";

async function seed() {
  console.log("seeding...");

  const password = process.env.AUTH_PASSWORD ?? "admin";
  const passwordHash = await hash(password, 12);

  await db
    .insert(users)
    .values({
      email: "admin@accred.local",
      passwordHash,
    })
    .onConflictDoNothing();

  await db
    .insert(festivals)
    .values({
      name: "Festival de Cannes 2026",
      location: "Cannes, France",
      edition: "79e édition",
      startDate: "2026-05-12",
      endDate: "2026-05-23",
      status: "upcoming",
    })
    .onConflictDoNothing();

  console.log("done.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
