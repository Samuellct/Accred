import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import * as schema from "./schema";

const rawUrl = process.env.DATABASE_URL ?? "file:./data/app.db";
// drizzle-kit veut "file:..." mais better-sqlite3 veut juste le path
const dbPath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl;

// s'assurer que le dossier existe
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
