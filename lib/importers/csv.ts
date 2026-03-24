import type { ParseResult } from "./types";
import { validateRow } from "./validate";

// separe une ligne CSV en champs, gere les champs entre guillemets
function splitLine(line: string, sep = ";"): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // guillemet escape ""
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export function parseCSV(content: string): ParseResult {
  const valid: ParseResult["valid"] = [];
  const errors: ParseResult["errors"] = [];

  // normalise fins de ligne
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // ignore lignes commentees et lignes vides, cherche le header
  let headerIdx = -1;
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    // premiere ligne non-commentee = header
    headers = splitLine(line).map((h) => h.trim().toLowerCase());
    headerIdx = i;
    break;
  }

  if (headerIdx === -1 || headers.length === 0) {
    errors.push({ line: 0, field: "header", message: "Fichier vide ou sans en-tete" });
    return { valid, errors };
  }

  // colonnes requises
  const required = ["titre", "date", "heure"];
  for (const col of required) {
    if (!headers.includes(col)) {
      errors.push({ line: headerIdx + 1, field: col, message: `Colonne requise manquante : "${col}"` });
    }
  }
  if (errors.length > 0) return { valid, errors };

  // parse les lignes de donnees
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    const fields = splitLine(line);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = fields[idx]?.trim() ?? "";
    });

    const { row, errors: rowErrors } = validateRow(raw, i + 1);
    if (row) valid.push(row);
    errors.push(...rowErrors);
  }

  return { valid, errors };
}
