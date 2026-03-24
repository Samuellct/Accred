export interface SeanceRow {
  titre: string;
  date: string;    // YYYY-MM-DD
  heure: string;   // HH:mm
  salle?: string;
  section?: string;
  duree?: number;  // minutes
  format?: string;
  notes?: string;
}

export interface ImportError {
  line: number;
  field: string;
  message: string;
}

export interface ParseResult {
  valid: SeanceRow[];
  errors: ImportError[];
}
