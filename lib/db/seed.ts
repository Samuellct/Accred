import "dotenv/config";
import { hash } from "bcryptjs";
import { db } from "./index";
import { users, festivals } from "./schema";

async function seed() {
  console.log("seeding...");

  const password = process.env.AUTH_PASSWORD ?? "admin";
  const passwordHash = await hash(password, 12);

  // onConflictDoUpdate pour toujours rafraichir le hash si le user existe deja
  await db
    .insert(users)
    .values({
      email: "admin@accred.local",
      passwordHash,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash },
    });

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
