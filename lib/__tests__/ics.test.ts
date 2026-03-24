import { describe, it, expect } from "vitest";
import { generateICS } from "../ics";
import type { ICSEvent } from "../ics";

function makeEvent(override: Partial<ICSEvent> = {}): ICSEvent {
  return {
    seanceId: 1,
    filmTitle: "Anora",
    dateTime: "2026-05-13T10:00",
    duration: 139,
    venue: "Grand Theatre Lumiere",
    section: "Competition",
    format: null,
    ...override,
  };
}

describe("generateICS", () => {
  it("genere un wrapper VCALENDAR valide", () => {
    const ics = generateICS([]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//Accred//FR");
  });

  it("retourne un ICS vide (sans VEVENT) si pas d'events", () => {
    const ics = generateICS([]);
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("genere un VEVENT par seance", () => {
    const ics = generateICS([makeEvent({ seanceId: 1 }), makeEvent({ seanceId: 2 })]);
    const count = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(count).toBe(2);
  });

  it("UID stable base sur seanceId", () => {
    const ics = generateICS([makeEvent({ seanceId: 42 })]);
    expect(ics).toContain("UID:seance-42@accred.fr");
  });

  it("gere les caracteres accentues dans le titre", () => {
    const ics = generateICS([makeEvent({ filmTitle: "L'Amour de la vie" })]);
    expect(ics).toContain("SUMMARY:L'Amour de la vie");
  });

  it("escape les virgules dans le titre", () => {
    const ics = generateICS([makeEvent({ filmTitle: "Tom, Dick et Harry" })]);
    expect(ics).toContain("SUMMARY:Tom\\, Dick et Harry");
  });

  it("escape les points-virgules dans la salle", () => {
    const ics = generateICS([makeEvent({ venue: "Salle A;B" })]);
    expect(ics).toContain("LOCATION:Salle A\\;B");
  });

  it("calcule DTEND avec la duree", () => {
    // 10:00 + 139min = 12:19
    const ics = generateICS([makeEvent({ duration: 139 })]);
    expect(ics).toContain("DTSTART:20260513T100000");
    expect(ics).toContain("DTEND:20260513T121900");
  });

  it("utilise 120min par defaut si duree inconnue", () => {
    // 10:00 + 120min = 12:00
    const ics = generateICS([makeEvent({ duration: null })]);
    expect(ics).toContain("DTEND:20260513T120000");
  });

  it("inclut LOCATION si venue renseignee", () => {
    const ics = generateICS([makeEvent({ venue: "Debussy" })]);
    expect(ics).toContain("LOCATION:Debussy");
  });

  it("n'inclut pas LOCATION si venue null", () => {
    const ics = generateICS([makeEvent({ venue: null })]);
    expect(ics).not.toContain("LOCATION:");
  });

  it("inclut DESCRIPTION avec section si presente", () => {
    const ics = generateICS([makeEvent({ section: "Un Certain Regard", format: null })]);
    expect(ics).toContain("DESCRIPTION:Section: Un Certain Regard");
  });

  it("utilise des CRLF comme fins de ligne (RFC 5545)", () => {
    const ics = generateICS([makeEvent()]);
    expect(ics).toContain("\r\n");
    // pas de \n seuls (chaque \n doit etre precede d'un \r)
    const withoutCRLF = ics.replace(/\r\n/g, "");
    expect(withoutCRLF).not.toContain("\n");
  });
});
