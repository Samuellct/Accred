"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import RatingStars from "@/components/journal/RatingStars";
import TagPicker from "@/components/journal/TagPicker";

interface Film {
  id: number;
  title: string;
  director: string | null;
  posterPath: string | null;
  duration: number | null;
}

interface SelectionFilm {
  filmId: number | null;
  seance: { dateTime: string };
  film: Film | null;
}

interface ExistingLog {
  id: number;
  filmId: number | null;
  rating: number | null;
  text: string | null;
  tags: string | null;
}

function QuickNoteInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filmIdParam = searchParams.get("filmId");

  const [film, setFilm] = useState<Film | null>(null);
  const [unrated, setUnrated] = useState<SelectionFilm[]>([]);
  const [existingLogId, setExistingLogId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [seenAt, setSeenAt] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        if (filmIdParam) {
          // charger le film et verifier si un log existe deja
          const [filmRes, journalRes] = await Promise.all([
            fetch(`/api/festivals/${id}/films/${filmIdParam}`),
            fetch(`/api/festivals/${id}/journal`),
          ]);
          if (filmRes.ok) {
            const data = await filmRes.json() as { film: Film };
            setFilm(data.film);
          }
          if (journalRes.ok) {
            const logs = await journalRes.json() as ExistingLog[];
            const existing = logs.find((l) => l.filmId === Number(filmIdParam));
            if (existing) {
              setExistingLogId(existing.id);
              setRating(existing.rating ?? 0);
              setText(existing.text ?? "");
              setTags(existing.tags ? (JSON.parse(existing.tags) as string[]) : []);
            }
          }
        } else {
          // pas de filmId : charger les selections non notees
          const [selRes, journalRes] = await Promise.all([
            fetch(`/api/festivals/${id}/selections`),
            fetch(`/api/festivals/${id}/journal`),
          ]);
          const sels = await selRes.json() as SelectionFilm[];
          const logs = await journalRes.json() as { filmId: number | null }[];
          const loggedFilmIds = new Set(logs.map((l) => l.filmId).filter(Boolean));
          const now = new Date().toISOString();
          // films selectionnes avec seance passee, pas encore notes
          const candidates = sels.filter(
            (s) => s.film && s.seance.dateTime < now && !loggedFilmIds.has(s.film.id)
          );
          // dedoublonner par filmId
          const seen = new Set<number>();
          const deduped = candidates.filter((s) => {
            if (!s.filmId || seen.has(s.filmId)) return false;
            seen.add(s.filmId);
            return true;
          });
          setUnrated(deduped);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id, filmIdParam]);

  async function handleSave() {
    if (!film) return;
    setSaving(true);
    setError("");
    try {
      if (existingLogId) {
        // PATCH log existant
        const res = await fetch(`/api/journal/${existingLogId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: rating || null, text: text || null, tags }),
        });
        if (!res.ok) throw new Error("erreur");
      } else {
        const res = await fetch(`/api/festivals/${id}/journal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filmId: film.id,
            rating: rating || null,
            text: text || null,
            tags,
            seenAt,
          }),
        });
        if (!res.ok) throw new Error("erreur");
      }
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

  // pas de filmId et pas de film selectionne : afficher le picker
  if (!filmIdParam && !film) {
    return (
      <div className="px-4 py-6 max-w-lg">
        <h2 className="font-serif text-xl text-brun mb-4">Quel film noter ?</h2>
        {unrated.length === 0 ? (
          <p className="text-gris-c text-sm">Aucun film a noter pour l&apos;instant.</p>
        ) : (
          <div className="space-y-px">
            {unrated.map((s) => (
              <button
                key={s.filmId}
                onClick={() => router.push(`/festivals/${id}/journal/new?filmId=${s.filmId}`)}
                className="w-full flex items-center gap-3 bg-parchemin border border-or/25 px-3 py-2.5 hover:bg-creme transition-colors duration-[0.15s] text-left"
              >
                {s.film?.posterPath ? (
                  <div className="relative w-10 flex-shrink-0" style={{ height: "56px" }}>
                    <Image src={s.film.posterPath} alt={s.film.title} fill unoptimized className="object-cover" sizes="40px" />
                  </div>
                ) : (
                  <div className="w-10 h-14 flex-shrink-0 bg-noir/10 flex items-center justify-center">
                    <span className="text-gris-c text-[0.55rem]">?</span>
                  </div>
                )}
                <span className="font-serif text-brun text-sm">{s.film?.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!film) return null;

  return (
    <div className="px-4 py-6 max-w-lg">
      {/* header film compact */}
      <div className="flex items-center gap-3 mb-6">
        {film.posterPath ? (
          <div className="relative flex-shrink-0 w-12" style={{ height: "72px" }}>
            <Image src={film.posterPath} alt={film.title} fill unoptimized className="object-cover" sizes="48px" />
          </div>
        ) : (
          <div className="w-12 h-18 flex-shrink-0 bg-noir/10" />
        )}
        <div className="min-w-0">
          <h2 className="font-serif text-brun text-lg leading-tight truncate">{film.title}</h2>
          {film.director && <p className="text-gris-c text-xs mt-0.5">{film.director}</p>}
          {existingLogId && <p className="text-or text-[0.6rem] uppercase tracking-widest mt-1">Modification</p>}
        </div>
      </div>

      {/* note -- element principal */}
      <div className="flex justify-center mb-6">
        <RatingStars value={rating} onChange={setRating} size="md" />
      </div>

      {/* tags */}
      <div className="mb-5">
        <TagPicker selected={tags} onChange={setTags} />
      </div>

      {/* texte optionnel */}
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Quelques mots..."
        className="w-full bg-parchemin border border-creme-f text-brun text-sm px-3 py-2.5 focus:outline-none focus:border-or transition-colors duration-[0.15s] resize-none mb-4"
      />

      {/* date */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[0.6rem] uppercase tracking-widest text-gris-c">Vu le</span>
        <input
          type="date"
          value={seenAt}
          onChange={(e) => setSeenAt(e.target.value)}
          className="text-xs text-brun bg-parchemin border border-or/25 px-2 py-1 focus:outline-none focus:border-or"
        />
      </div>

      {error && <p className="text-or text-xs mb-3">{error}</p>}

      <div className="flex gap-3">
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button variant="secondary" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

export default function QuickNotePage() {
  return (
    <Suspense fallback={<div className="px-4 py-6"><p className="text-gris-c text-sm">Chargement...</p></div>}>
      <QuickNoteInner />
    </Suspense>
  );
}
