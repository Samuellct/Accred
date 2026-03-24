import type { ParseResult } from "./types";
import { validateRow } from "./validate";

// aliases EN -> FR pour les cles
const KEY_MAP: Record<string, string> = {
  title: "titre",
  venue: "salle",
  duration: "duree",
  time: "heure",
  room: "salle",
};

function normalizeKeys(obj: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const normalized = key.trim().toLowerCase();
    // priorite FR : si cle FR existe, elle ecrase l'alias EN
    const mapped = KEY_MAP[normalized] ?? normalized;
    if (!(mapped in result)) {
      result[mapped] = val != null ? String(val) : "";
    }
  }
  // deuxieme passe : cles FR ecrasent les cles EN mappees
  for (const [key, val] of Object.entries(obj)) {
    const fr = key.trim().toLowerCase();
    if (!KEY_MAP[fr]) {
      result[fr] = val != null ? String(val) : "";
    }
  }
  return result;
}

export function parseJSON(content: string): ParseResult {
  const valid: ParseResult["valid"] = [];
  const errors: ParseResult["errors"] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    errors.push({ line: 0, field: "json", message: "JSON invalide" });
    return { valid, errors };
  }

  // accept array direct ou { seances: [...] }
  let items: unknown[];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    "seances" in parsed &&
    Array.isArray((parsed as Record<string, unknown>).seances)
  ) {
    items = (parsed as Record<string, unknown>).seances as unknown[];
  } else {
    errors.push({ line: 0, field: "structure", message: 'Structure invalide : attendu un tableau ou { "seances": [...] }' });
    return { valid, errors };
  }

  if (items.length === 0) {
    return { valid, errors };
  }

  items.forEach((item, idx) => {
    const line = idx + 1;
    if (!item || typeof item !== "object") {
      errors.push({ line, field: "item", message: "Element invalide (attendu un objet)" });
      return;
    }
    const raw = normalizeKeys(item as Record<string, unknown>);
    const { row, errors: rowErrors } = validateRow(raw, line);
    if (row) valid.push(row);
    errors.push(...rowErrors);
  });

  return { valid, errors };
}
