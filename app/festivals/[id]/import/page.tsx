"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { parseCSV } from "@/lib/importers/csv";
import { parseJSON } from "@/lib/importers/json";
import type { SeanceRow, ImportError } from "@/lib/importers/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ImportPreview from "@/components/festival/ImportPreview";
import ImportErrors from "@/components/festival/ImportErrors";
import TMDbAutocomplete from "@/components/festival/TMDbAutocomplete";
import ProgrammeManager from "@/components/festival/ProgrammeManager";

type Tab = "csv" | "json" | "manuel" | "seances";

interface ImportResult {
  imported: number;
  filmsCreated: number;
  errors: { line: number; message: string }[];
}

export default function ImportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("csv");

  // etats CSV/JSON
  const [rows, setRows] = useState<SeanceRow[]>([]);
  const [parseErrors, setParseErrors] = useState<ImportError[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // salles connues du festival (pour autocompletion)
  const [knownVenues, setKnownVenues] = useState<string[]>([]);

  // etats saisie manuelle
  const [filmTitle, setFilmTitle] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualHeure, setManualHeure] = useState("");
  const [manualSalle, setManualSalle] = useState("");
  const [manualSection, setManualSection] = useState("");
  const [manualFormat, setManualFormat] = useState("");
  const [manualDuree, setManualDuree] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);

  // charger les salles connues depuis les seances existantes
  useEffect(() => {
    void fetch(`/api/festivals/${id}/seances`).then(async (r) => {
      const data = await r.json() as { venue: string | null }[];
      const venues = Array.from(new Set(data.map((s) => s.venue).filter(Boolean))) as string[];
      setKnownVenues(venues);
    });
  }, [id]);

  function readFile(file: File, type: "csv" | "json") {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = type === "csv" ? parseCSV(content) : parseJSON(content);
      setRows(parsed.valid);
      setParseErrors(parsed.errors);
      setResult(null);
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch(`/api/festivals/${id}/seances/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, source: tab }),
      });
      const data = await res.json() as ImportResult;
      setResult(data);
      setRows([]);
      setParseErrors([]);
    } finally {
      setImporting(false);
    }
  }

  const handleTmdbSelect = useCallback((r: { tmdbId: number; title: string }) => {
    setFilmTitle(r.title);
    setSelectedTmdbId(r.tmdbId);
  }, []);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setManualError("");
    if (!filmTitle.trim() || !manualDate || !manualHeure) {
      setManualError("Titre, date et heure sont requis");
      return;
    }
    setManualLoading(true);
    try {
      const res = await fetch(`/api/festivals/${id}/seances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filmTitle: filmTitle.trim(),
          dateTime: `${manualDate}T${manualHeure}`,
          venue: manualSalle || undefined,
          section: manualSection || undefined,
          format: manualFormat || undefined,
          duration: manualDuree ? Number(manualDuree) : undefined,
          tmdbId: selectedTmdbId ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setManualSuccess(true);
      setFilmTitle("");
      setManualDate("");
      setManualHeure("");
      setManualSalle("");
      setManualSection("");
      setManualFormat("");
      setManualDuree("");
      setSelectedTmdbId(null);
    } catch {
      setManualError("Erreur lors de la creation de la seance");
    } finally {
      setManualLoading(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "csv", label: "CSV" },
    { key: "json", label: "JSON" },
    { key: "manuel", label: "Saisie manuelle" },
    { key: "seances", label: "Gerer les seances" },
  ];

  return (
    <div className="px-4 py-6 max-w-3xl">
      <h2 className="font-serif text-2xl text-brun mb-6">Importer des seances</h2>

      {/* onglets */}
      <div className="flex border-b border-creme-f mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setRows([]); setParseErrors([]); setResult(null); }}
            className={`px-4 py-2.5 text-xs uppercase tracking-widest transition-colors duration-[0.15s]
              ${tab === t.key
                ? "text-or border-b-2 border-or -mb-px"
                : "text-gris-c hover:text-brun"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CSV */}
      {tab === "csv" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-gris-c text-sm">Fichier CSV avec point-virgule, encodage UTF-8.</p>
            <a
              href="/templates/import_seances.csv"
              download
              className="text-or text-xs uppercase tracking-widest hover:opacity-70 transition-opacity duration-[0.15s]"
            >
              Telecharger le modele
            </a>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f, "csv");
            }}
            className="text-sm text-gris-c file:mr-4 file:bg-noir file:text-parchemin file:text-xs file:uppercase file:tracking-widest file:border-0 file:px-4 file:py-2 file:cursor-pointer"
          />
          <ImportErrors errors={parseErrors} />
          <ImportPreview rows={rows} />
          {rows.length > 0 && !result && (
            <div className="mt-4">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? "Import en cours..." : `Importer ${rows.length} seance${rows.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* JSON */}
      {tab === "json" && (
        <div>
          <p className="text-gris-c text-sm mb-4">Fichier JSON (tableau ou {"{"} seances: [...] {"}"}).</p>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f, "json");
            }}
            className="text-sm text-gris-c file:mr-4 file:bg-noir file:text-parchemin file:text-xs file:uppercase file:tracking-widest file:border-0 file:px-4 file:py-2 file:cursor-pointer"
          />
          <div className="mt-4">
            <label className="text-xs uppercase tracking-widest text-gris-c mb-1.5 block">
              Ou coller le JSON directement
            </label>
            <textarea
              rows={6}
              placeholder='[{"titre": "Anora", "date": "2026-05-13", "heure": "10:00"}]'
              onChange={(e) => {
                const content = e.target.value.trim();
                if (content) {
                  const parsed = parseJSON(content);
                  setRows(parsed.valid);
                  setParseErrors(parsed.errors);
                  setResult(null);
                }
              }}
              className="w-full bg-parchemin border border-creme-f text-brun px-4 py-2.5 text-sm font-mono focus:border-or focus:outline-none transition-colors duration-[0.15s]"
            />
          </div>
          <ImportErrors errors={parseErrors} />
          <ImportPreview rows={rows} />
          {rows.length > 0 && !result && (
            <div className="mt-4">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? "Import en cours..." : `Importer ${rows.length} seance${rows.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Saisie manuelle */}
      {tab === "manuel" && (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 max-w-lg">
          <div>
            <label className="text-xs uppercase tracking-widest text-gris-c mb-1.5 block">
              Titre du film
            </label>
            <TMDbAutocomplete
              value={filmTitle}
              onChange={(v) => { setFilmTitle(v); setSelectedTmdbId(null); }}
              onSelect={handleTmdbSelect}
              placeholder="Rechercher un film (TMDb)"
            />
            {selectedTmdbId && (
              <p className="text-xs text-or mt-1">TMDb #{selectedTmdbId} selectionne</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              id="date"
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
            />
            <Input
              label="Heure"
              id="heure"
              type="time"
              value={manualHeure}
              onChange={(e) => setManualHeure(e.target.value)}
            />
          </div>
          {/* datalist salles connues */}
          <datalist id="venues-list">
            {knownVenues.map((v) => <option key={v} value={v} />)}
          </datalist>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="salle" className="text-xs uppercase tracking-widest text-gris-c mb-1.5 block">
                Salle
              </label>
              <input
                id="salle"
                list="venues-list"
                value={manualSalle}
                onChange={(e) => setManualSalle(e.target.value)}
                placeholder="Grand Theatre Lumiere"
                className="w-full bg-parchemin border border-creme-f text-brun px-4 py-2.5 text-sm focus:border-or focus:outline-none transition-colors duration-[0.15s]"
              />
            </div>
            <Input
              label="Section"
              id="section"
              value={manualSection}
              onChange={(e) => setManualSection(e.target.value)}
              placeholder="Competition"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Format"
              id="format"
              value={manualFormat}
              onChange={(e) => setManualFormat(e.target.value)}
              placeholder="IMAX, 35mm..."
            />
            <Input
              label="Duree (min)"
              id="duree"
              type="number"
              min={1}
              value={manualDuree}
              onChange={(e) => setManualDuree(e.target.value)}
            />
          </div>
          {manualError && <p className="text-or text-xs">{manualError}</p>}
          {manualSuccess && (
            <p className="text-sm text-brun">
              Seance creee.{" "}
              <button
                type="button"
                onClick={() => setManualSuccess(false)}
                className="text-or underline"
              >
                Ajouter une autre
              </button>
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={manualLoading}>
              {manualLoading ? "Creation..." : "Creer la seance"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/festivals/${id}/programme`)}
            >
              Voir le programme
            </Button>
          </div>
        </form>
      )}

      {/* Gestion des seances */}
      {tab === "seances" && (
        <ProgrammeManager festivalId={id} />
      )}

      {/* Resume apres import */}
      {result && (
        <div className="mt-6 bg-parchemin border border-or/25 p-4">
          <p className="text-brun text-sm">
            <span className="font-medium">{result.imported}</span> seance{result.imported > 1 ? "s" : ""} importee{result.imported > 1 ? "s" : ""},
            {" "}<span className="font-medium">{result.filmsCreated}</span> film{result.filmsCreated > 1 ? "s" : ""} cree{result.filmsCreated > 1 ? "s" : ""}.
          </p>
          {result.errors.length > 0 && (
            <p className="text-or text-xs mt-1">{result.errors.length} erreur{result.errors.length > 1 ? "s" : ""} lors de {"l'import"}.</p>
          )}
          <div className="flex gap-3 mt-4">
            <Button
              size="sm"
              onClick={() => router.push(`/festivals/${id}/import/review`)}
            >
              Confirmer les films TMDb
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push(`/festivals/${id}/programme`)}
            >
              Voir le programme
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
