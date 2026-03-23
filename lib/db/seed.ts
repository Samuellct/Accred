import { db } from "./index";
import { users, festivals } from "./schema";

// placeholder hash -- sera remplacé en Phase 3 par bcrypt
const PLACEHOLDER_HASH = "changeme";

async function seed() {
  console.log("seeding...");

  // user admin (id=1, toujours 1 en V1)
  await db
    .insert(users)
    .values({
      email: "admin@accred.local",
      passwordHash: PLACEHOLDER_HASH,
    })
    .onConflictDoNothing();

  // festival de test
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
