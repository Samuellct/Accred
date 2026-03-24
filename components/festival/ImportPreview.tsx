import type { SeanceRow } from "@/lib/importers/types";

interface Props {
  rows: SeanceRow[];
}

export default function ImportPreview({ rows }: Props) {
  if (rows.length === 0) return null;
  const preview = rows.slice(0, 20);

  return (
    <div className="mt-4 overflow-x-auto">
      <p className="text-xs text-gris-c mb-2 uppercase tracking-widest">
        {rows.length} seance{rows.length > 1 ? "s" : ""} valide{rows.length > 1 ? "s" : ""}
        {rows.length > 20 ? ` (20 premieres affichees)` : ""}
      </p>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-creme-f text-gris-c uppercase tracking-widest">
            <th className="text-left px-3 py-2">Titre</th>
            <th className="text-left px-3 py-2">Date</th>
            <th className="text-left px-3 py-2">Heure</th>
            <th className="text-left px-3 py-2 hidden sm:table-cell">Salle</th>
            <th className="text-left px-3 py-2 hidden sm:table-cell">Section</th>
          </tr>
        </thead>
        <tbody>
          {preview.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-creme-f ${i % 2 === 0 ? "bg-parchemin" : "bg-creme"}`}
            >
              <td className="px-3 py-2 text-brun font-medium">{row.titre}</td>
              <td className="px-3 py-2 text-gris-c">{row.date}</td>
              <td className="px-3 py-2 text-gris-c">{row.heure}</td>
              <td className="px-3 py-2 text-gris-c hidden sm:table-cell">{row.salle ?? "—"}</td>
              <td className="px-3 py-2 text-gris-c hidden sm:table-cell">{row.section ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
