import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { festivals } from "@/lib/db/schema";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

// format "12 - 23 mai 2026" en FR
function formatDateRange(start: string, end: string) {
  const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const s = fmt.format(new Date(start));
  const e = fmt.format(new Date(end));
  // si meme mois+annee, compacter
  const [sd, sm, sy] = s.split(" ");
  const [, em, ey] = e.split(" ");
  if (sy === ey && sm === em) return `${sd} - ${e}`;
  return `${s} – ${e}`;
}

const statusLabel: Record<string, string> = {
  upcoming: "A venir",
  active: "En cours",
  done: "Termine",
};

const statusColor: Record<string, string> = {
  upcoming: "text-or",
  active: "text-or-chaud",
  done: "text-gris-c",
};

export default async function Home() {
  const rows = await db.query.festivals.findMany({
    orderBy: [desc(festivals.startDate)],
  });

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl text-brun">Mes festivals</h1>
        <Link href="/festivals/new">
          <Button variant="primary" size="sm">Nouveau festival</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gris-c text-sm mb-4">{"Aucun festival pour l'instant."}</p>
          <Link href="/festivals/new">
            <Button variant="secondary">Ajouter un festival</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((f) => (
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
                  <span className={`text-xs uppercase tracking-widest shrink-0 ${statusColor[f.status] ?? "text-gris-c"}`}>
                    {statusLabel[f.status] ?? f.status}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
