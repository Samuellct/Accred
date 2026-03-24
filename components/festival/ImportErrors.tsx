import type { ImportError } from "@/lib/importers/types";

interface Props {
  errors: ImportError[];
}

export default function ImportErrors({ errors }: Props) {
  if (errors.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-xs text-or uppercase tracking-widest mb-2">
        {errors.length} erreur{errors.length > 1 ? "s" : ""}
      </p>
      <ul className="flex flex-col gap-1">
        {errors.map((err, i) => (
          <li key={i} className="text-xs text-brun bg-parchemin border-l-2 border-or px-3 py-1.5">
            <span className="text-gris-c mr-2">Ligne {err.line} — {err.field} :</span>
            {err.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
