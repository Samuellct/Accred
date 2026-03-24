// generation fichiers iCal (RFC 5545)

export interface ICSEvent {
  seanceId: number;
  filmTitle: string;
  dateTime: string; // ISO, ex: "2026-05-13T10:00"
  duration: number | null; // minutes
  venue: string | null;
  section: string | null;
  format: string | null;
}

const DEFAULT_DURATION = 120;

// escape les caracteres speciaux iCal (RFC 5545 section 3.3.11)
function escapeICS(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

// fold les lignes a 75 octets (RFC 5545 section 3.1)
// on fold sur les caracteres, pas les octets, pour simplifier (ok en pratique)
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  let first = true;
  while (remaining.length > 0) {
    const limit = first ? 75 : 74; // 74 car la continuation commence par un espace
    parts.push(remaining.slice(0, limit));
    remaining = remaining.slice(limit);
    first = false;
  }
  return parts.join("\r\n ");
}

// formater une date (ISO string ou Date) en YYYYMMDDTHHMMSS (floating time)
function formatDT(input: string | Date): string {
  const d = input instanceof Date ? input : new Date(input);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    "00"
  );
}

// ajouter des minutes a une date ISO, retourne un objet Date
// (on evite toISOString() pour ne pas perdre le timezone local)
function addMinutes(isoDate: string, minutes: number): Date {
  const d = new Date(isoDate);
  return new Date(d.getTime() + minutes * 60000);
}

export function generateICS(events: ICSEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Accred//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const ev of events) {
    const dur = ev.duration ?? DEFAULT_DURATION;
    const dtStart = formatDT(ev.dateTime);
    const dtEnd = formatDT(addMinutes(ev.dateTime, dur));

    const descParts: string[] = [];
    if (ev.section) descParts.push("Section: " + ev.section);
    if (ev.format) descParts.push("Format: " + ev.format);
    const desc = descParts.join("\\n");

    lines.push("BEGIN:VEVENT");
    lines.push(foldLine("UID:seance-" + ev.seanceId + "@accred.fr"));
    lines.push(foldLine("DTSTART:" + dtStart));
    lines.push(foldLine("DTEND:" + dtEnd));
    lines.push(foldLine("SUMMARY:" + escapeICS(ev.filmTitle)));
    if (ev.venue) {
      lines.push(foldLine("LOCATION:" + escapeICS(ev.venue)));
    }
    if (desc) {
      lines.push(foldLine("DESCRIPTION:" + desc));
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
