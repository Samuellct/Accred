// programme festival -- Phase 6
import Link from "next/link";

export default function ProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  // params sera utilise en Phase 6 pour afficher les vraies seances
  void params;
  return (
    <div className="px-4 py-6">
      <h2 className="font-serif text-2xl text-brun">Programme</h2>
      <p className="text-gris-c text-sm mt-4">{"Aucune seance pour l'instant."}</p>
      <Link
        href="import"
        className="inline-block mt-4 text-xs uppercase tracking-widest text-or hover:opacity-70 transition-opacity duration-[0.15s]"
      >
        Importer des seances →
      </Link>
    </div>
  );
}
