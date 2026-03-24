import type { SeanceRow, ImportError } from "./types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export function validateRow(
  raw: Record<string, string>,
  line: number
): { row?: SeanceRow; errors: ImportError[] } {
  const errors: ImportError[] = [];

  const titre = raw.titre?.trim();
  const date = raw.date?.trim();
  const heure = raw.heure?.trim();

  if (!titre) errors.push({ line, field: "titre", message: "Titre manquant" });
  if (!date) {
    errors.push({ line, field: "date", message: "Date manquante" });
  } else if (!DATE_RE.test(date) || isNaN(Date.parse(date))) {
    errors.push({ line, field: "date", message: `Format date invalide (attendu YYYY-MM-DD) : "${date}"` });
  }
  if (!heure) {
    errors.push({ line, field: "heure", message: "Heure manquante" });
  } else if (!TIME_RE.test(heure)) {
    errors.push({ line, field: "heure", message: `Format heure invalide (attendu HH:mm) : "${heure}"` });
  }

  const dureeStr = raw.duree?.trim();
  let duree: number | undefined;
  if (dureeStr) {
    duree = Number(dureeStr);
    if (isNaN(duree) || duree <= 0) {
      errors.push({ line, field: "duree", message: `Duree invalide : "${dureeStr}"` });
      duree = undefined;
    }
  }

  if (errors.length > 0) return { errors };

  return {
    row: {
      titre: titre!,
      date: date!,
      heure: heure!,
      salle: raw.salle?.trim() || undefined,
      section: raw.section?.trim() || undefined,
      format: raw.format?.trim() || undefined,
      notes: raw.notes?.trim() || undefined,
      duree,
    },
    errors: [],
  };
}
