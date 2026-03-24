"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import RatingStars from "@/components/journal/RatingStars";
import Button from "@/components/ui/Button";
import { formatRating } from "@/lib/journal";

interface Film {
  id: number;
  title: string;
  director: string | null;
  posterPath: string | null;
  duration: number | null;
}

interface LogEntry {
  id: number;
  filmId: number | null;
  rating: number | null;
  text: string | null;
  longCritique: string | null;
  letterboxdExported: number;
  tags: string | null;
  film: Film | null;
}

function parseTags(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json) as string[]; } catch { return []; }
}

function EditPageInner() {
  const { id, logId } = useParams<{ id: string; logId: string }>();
  const router = useRouter();

  const [entry, setEntry] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [critique, setCritique] = useState("");
  const [letterboxdFlag, setLetterboxdFlag] = useState(0);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/festivals/${id}/journal`);
        if (!res.ok) return;
        const logs = await res.json() as LogEntry[];
        const found = logs.find((l) => l.id === Number(logId));
        if (found) {
          setEntry(found);
          setCritique(found.longCritique ?? "");
          setLetterboxdFlag(found.letterboxdExported ?? 0);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id, logId]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/journal/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ longCritique: critique || null, letterboxdExported: letterboxdFlag }),
      });
      if (!res.ok) throw new Error("erreur");
      router.push(`/festivals/${id}/journal`);
    } catch {
      setError("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="px-4 py-6"><p className="text-gris-c text-sm">Chargement...</p></div>;
  }

  if (!entry) {
    return <div className="px-4 py-6"><p className="text-gris-c text-sm">Log introuvable.</p></div>;
  }

  const tags = parseTags(entry.tags);

  return (
    <div className="px-4 py-4 max-w-4xl">
      {/* header film */}
      <div className="flex items-center gap-3 mb-5">
        {entry.film?.posterPath ? (
          <div className="relative flex-shrink-0 w-12" style={{ height: "72px" }}>
            <Image src={entry.film.posterPath} alt={entry.film.title ?? ""} fill unoptimized className="object-cover" sizes="48px" />
          </div>
        ) : (
          <div className="w-12 h-18 flex-shrink-0 bg-noir/10" />
        )}
        <div className="min-w-0">
          <h2 className="font-serif text-brun text-lg leading-tight truncate">{entry.film?.title ?? "Film inconnu"}</h2>
          {entry.film?.director && <p className="text-gris-c text-xs mt-0.5">{entry.film.director}</p>}
        </div>
      </div>

      {/* resume QuickNote -- lecture seule */}
      <div className="bg-parchemin border border-or/25 px-3 py-2.5 mb-5 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {entry.rating != null && (
            <div className="flex items-center gap-2 mb-1">
              <RatingStars value={entry.rating} readOnly size="sm" />
              <span className="text-or text-xs tabular-nums">{formatRating(entry.rating)}</span>
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {tags.map((t) => (
                <span key={t} className="text-[0.55rem] text-gris-c border border-creme-f px-1.5 py-0.5">#{t}</span>
              ))}
            </div>
          )}
          {entry.text && (
            <p className="text-brun text-xs leading-relaxed line-clamp-2">{entry.text}</p>
          )}
        </div>
        <button
          onClick={() => router.push(`/festivals/${id}/journal/new?filmId=${entry.filmId}`)}
          className="flex-shrink-0 text-[0.55rem] uppercase tracking-widest text-or hover:opacity-70 transition-opacity duration-[0.15s]"
        >
          Modifier
        </button>
      </div>

      {/* editeur critique markdown */}
      {/* mobile : toggle editeur / apercu */}
      <div className="md:hidden mb-3 flex gap-2">
        <button
          onClick={() => setPreview(false)}
          className={`text-xs uppercase tracking-widest px-3 py-1.5 border transition-colors duration-[0.15s] ${!preview ? "bg-noir text-parchemin border-noir" : "bg-transparent text-gris-c border-creme-f"}`}
        >
          Editer
        </button>
        <button
          onClick={() => setPreview(true)}
          className={`text-xs uppercase tracking-widest px-3 py-1.5 border transition-colors duration-[0.15s] ${preview ? "bg-noir text-parchemin border-noir" : "bg-transparent text-gris-c border-creme-f"}`}
        >
          Apercu
        </button>
      </div>

      {/* desktop : side-by-side */}
      <div className="hidden md:grid md:grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-[0.6rem] uppercase tracking-widest text-gris-c mb-1.5">Critique</p>
          <textarea
            rows={16}
            value={critique}
            onChange={(e) => setCritique(e.target.value)}
            placeholder="Votre critique..."
            className="w-full bg-parchemin border border-creme-f text-brun text-sm px-3 py-2.5 focus:outline-none focus:border-or transition-colors duration-[0.15s] resize-none font-mono"
          />
        </div>
        <div>
          <p className="text-[0.6rem] uppercase tracking-widest text-gris-c mb-1.5">Apercu</p>
          <div className="bg-parchemin border border-creme-f px-4 py-3 min-h-[24rem] text-sm text-brun leading-relaxed">
            {critique ? <MarkdownPreview content={critique} /> : <span className="text-gris-c italic">Aucun contenu</span>}
          </div>
        </div>
      </div>

      {/* mobile : textarea ou preview */}
      <div className="md:hidden mb-5">
        {!preview ? (
          <textarea
            rows={14}
            value={critique}
            onChange={(e) => setCritique(e.target.value)}
            placeholder="Votre critique..."
            className="w-full bg-parchemin border border-creme-f text-brun text-sm px-3 py-2.5 focus:outline-none focus:border-or transition-colors duration-[0.15s] resize-none font-mono"
          />
        ) : (
          <div className="bg-parchemin border border-creme-f px-4 py-3 min-h-48 text-sm text-brun leading-relaxed">
            {critique ? <MarkdownPreview content={critique} /> : <span className="text-gris-c italic">Aucun contenu</span>}
          </div>
        )}
      </div>

      {/* option letterboxd */}
      <div className="mb-5">
        {letterboxdFlag === 1 ? (
          <div className="flex items-center gap-3">
            <span className="text-gris-c text-xs">Deja exporte vers Letterboxd</span>
            <button
              onClick={() => setLetterboxdFlag(0)}
              className="text-[0.55rem] uppercase tracking-widest text-or hover:opacity-70 transition-opacity duration-[0.15s]"
            >
              Reinclure
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={true}
              readOnly
              className="accent-or"
            />
            <span className="text-xs text-gris-c">Inclure dans le prochain export Letterboxd</span>
          </label>
        )}
      </div>

      {error && <p className="text-or text-xs mb-3">{error}</p>}

      <div className="flex gap-3">
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button variant="secondary" onClick={() => router.push(`/festivals/${id}/journal`)}>
          Retour
        </Button>
      </div>
    </div>
  );
}

// composant isole pour le preview markdown
function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="font-serif text-xl text-brun mb-3 mt-4">{children}</h1>,
        h2: ({ children }) => <h2 className="font-serif text-lg text-brun mb-2 mt-3">{children}</h2>,
        h3: ({ children }) => <h3 className="font-serif text-base text-brun mb-1.5 mt-2">{children}</h3>,
        p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
        em: ({ children }) => <em className="italic">{children}</em>,
        strong: ({ children }) => <strong className="font-medium text-brun">{children}</strong>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-or pl-3 my-3 text-gris-c italic">{children}</blockquote>
        ),
        ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-0.5">{children}</ol>,
        code: ({ children }) => (
          <code className="bg-creme-f text-brun text-xs px-1 py-0.5 font-mono">{children}</code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function EditPage() {
  return (
    <Suspense fallback={<div className="px-4 py-6"><p className="text-gris-c text-sm">Chargement...</p></div>}>
      <EditPageInner />
    </Suspense>
  );
}
