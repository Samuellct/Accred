export const dynamic = "force-dynamic";

import Link from "next/link";
import { eq, desc, inArray, sql, avg, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { festivals, logs, films } from "@/lib/db/schema";
import Card from "@/components/ui/Card";

function formatDateRange(start: string, end: string) {
  const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const s = fmt.format(new Date(start));
  const e = fmt.format(new Date(end));
  const [sd, sm, sy] = s.split(" ");
  const [, em, ey] = e.split(" ");
  if (sy === ey && sm === em) return `${sd} - ${e}`;
  return `${s} – ${e}`;
}

export default async function ArchivePage() {
  const doneFestivals = await db.query.festivals.findMany({
    where: eq(festivals.status, "done"),
    orderBy: [desc(festivals.startDate)],
  });

  // stats cumulees -- films uniques vus + avg rating
  let totalFilms = 0;
  let totalMinutes = 0;
  let avgRating: number | null = null;

  if (doneFestivals.length > 0) {
    const ids = doneFestivals.map((f) => f.id);

    const [agg] = await db
      .select({
        totalFilms: sql<number>`count(distinct ${logs.filmId})`,
        avgRating: avg(logs.rating),
        totalLogs: count(logs.id),
      })
      .from(logs)
      .where(inArray(logs.festivalId, ids));

    totalFilms = agg?.totalFilms ?? 0;
    avgRating = agg?.avgRating != null ? Math.round(Number(agg.avgRating) * 10) / 10 : null;

    // duree totale : sum durations des films distincts vus
    if (totalFilms > 0) {
      const durRows = await db
        .selectDistinct({ filmId: logs.filmId, duration: films.duration })
        .from(logs)
        .leftJoin(films, eq(logs.filmId, films.id))
        .where(inArray(logs.festivalId, ids));

      const seen = new Set<number>();
      for (const r of durRows) {
        if (r.filmId && !seen.has(r.filmId) && r.duration) {
          totalMinutes += r.duration;
          seen.add(r.filmId);
        }
      }
    }
  }

  const totalH = Math.floor(totalMinutes / 60);
  const totalMin = totalMinutes % 60;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-brun">Archive</h1>
      </div>

      {doneFestivals.length === 0 ? (
        <p className="text-gris-c text-sm">{"Aucun festival archive pour l'instant."}</p>
      ) : (
        <>
          {/* stats cumulees */}
          {totalFilms > 0 && (
            <Card className="mb-6">
              <div className="flex flex-wrap gap-6">
                <div className="text-center">
                  <p className="font-serif text-3xl text-brun">{totalFilms}</p>
                  <p className="text-gris-c text-xs uppercase tracking-widest mt-0.5">films vus</p>
                </div>
                {totalMinutes > 0 && (
                  <div className="text-center">
                    <p className="font-serif text-3xl text-brun">
                      {totalH > 0 ? `${totalH}h` : ""}{totalMin > 0 ? `${totalMin}min` : ""}
                    </p>
                    <p className="text-gris-c text-xs uppercase tracking-widest mt-0.5">de cinema</p>
                  </div>
                )}
                {avgRating != null && (
                  <div className="text-center">
                    <p className="font-serif text-3xl text-or">{String(avgRating).replace(".", ",")}</p>
                    <p className="text-gris-c text-xs uppercase tracking-widest mt-0.5">note moyenne</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* liste festivals */}
          <div className="flex flex-col gap-3">
            {doneFestivals.map((f) => (
              <Link key={f.id} href={`/festivals/${f.id}/programme`} className="block">
                <Card className="hover:border-or/50 transition-colors duration-[0.15s] cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-serif text-lg text-brun leading-tight">{f.name}</h2>
                      {(f.location || f.edition) && (
                        <p className="text-gris-c text-xs mt-0.5">
                          {[f.location, f.edition].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="text-gris-c text-xs mt-1">
                        {formatDateRange(f.startDate, f.endDate)}
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-widest text-gris-c shrink-0">Termine</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
