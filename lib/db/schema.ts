import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const festivals = sqliteTable("festivals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  location: text("location"),
  edition: text("edition"), // ex: "79e édition"
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming | active | done
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const films = sqliteTable("films", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  originalTitle: text("original_title"),
  director: text("director"),
  year: integer("year"),
  duration: integer("duration"), // minutes
  genres: text("genres"), // JSON array
  countries: text("countries"), // JSON array
  synopsis: text("synopsis"),
  posterPath: text("poster_path"), // chemin local dans public/posters/
  tmdbId: integer("tmdb_id").unique(),
  imdbId: text("imdb_id").unique(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const seances = sqliteTable("seances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  festivalId: integer("festival_id")
    .notNull()
    .references(() => festivals.id, { onDelete: "cascade" }),
  filmId: integer("film_id").references(() => films.id, {
    onDelete: "set null",
  }),
  dateTime: text("date_time").notNull(), // ISO datetime
  venue: text("venue"), // salle
  section: text("section"), // Compétition, Un Certain Regard...
  format: text("format"), // IMAX, 35mm...
  notes: text("notes"), // notes organisateur
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const selections = sqliteTable(
  "selections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .default(1)
      .references(() => users.id),
    seanceId: integer("seance_id")
      .notNull()
      .references(() => seances.id, { onDelete: "cascade" }),
    priority: text("priority").notNull().default("med"), // high | med | low
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("selections_user_seance").on(t.userId, t.seanceId)]
);

export const logs = sqliteTable("logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .default(1)
    .references(() => users.id),
  filmId: integer("film_id").references(() => films.id),
  festivalId: integer("festival_id").references(() => festivals.id),
  rating: real("rating"), // 0.5 à 5.0, demi-étoiles
  text: text("text"), // note rapide, saisie pendant le festival
  longCritique: text("long_critique"), // critique markdown, post-festival
  tags: text("tags"), // JSON array
  letterboxdExported: integer("letterboxd_exported").notNull().default(0), // 0 | 1
  seenAt: text("seen_at"), // date de visionnage
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
});
