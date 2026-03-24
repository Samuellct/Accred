import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { festivals } from "@/lib/db/schema";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import NextSeance from "@/components/festival/NextSeance";

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

export default async function FestivalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const festival = await db.query.festivals.findFirst({
    where: eq(festivals.id, Number(id)),
  });

  if (!festival) notFound();

  return (
    <div className="flex min-h-[calc(100vh-48px)]">
      <Sidebar festival={festival} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* bandeau contextuel festival */}
        <div className="bg-parchemin border-b border-creme-f px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-base text-brun leading-tight">{festival.name}</h1>
            {festival.edition && (
              <p className="text-gris-c text-xs">{festival.edition}</p>
            )}
          </div>
          <span className={`text-xs uppercase tracking-widest ${statusColor[festival.status] ?? "text-gris-c"}`}>
            {statusLabel[festival.status] ?? festival.status}
          </span>
        </div>
        <NextSeance festivalId={festival.id} status={festival.status} />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav festivalId={festival.id} />
    </div>
  );
}
