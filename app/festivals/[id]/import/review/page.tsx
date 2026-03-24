"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TMDbMatchCard from "@/components/festival/TMDbMatchCard";
import Button from "@/components/ui/Button";

interface Film {
  id: number;
  title: string;
  year: number | null;
  duration: number | null;
  posterPath: string | null;
  tmdbId: number | null;
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch(`/api/festivals/${id}/films?unmatched=true`)
      .then((r) => r.json())
      .then((data: Film[]) => setFilms(data))
      .finally(() => setLoading(false));
  }, [id]);

  function handleDone(filmId: number) {
    setDone((prev) => new Set([...prev, filmId]));
  }

  const remaining = films.filter((f) => !done.has(f.id));
  const confirmed = done.size;
  const total = films.length;

  if (loading) {
    return (
      <div className="px-4 py-6">
        <p className="text-gris-c text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-brun">Revue TMDb</h2>
        {total > 0 && (
          <span className="text-xs text-gris-c uppercase tracking-widest">
            {confirmed}/{total} confirmes
          </span>
        )}
      </div>

      {total === 0 && (
        <div>
          <p className="text-gris-c text-sm mb-4">Tous les films ont deja une correspondance TMDb.</p>
          <Button variant="secondary" onClick={() => router.push(`/festivals/${id}/programme`)}>
            Retour au programme
          </Button>
        </div>
      )}

      {remaining.length === 0 && total > 0 && (
        <div>
          <p className="text-brun text-sm mb-4">Revue terminee — {confirmed} film{confirmed > 1 ? "s" : ""} traite{confirmed > 1 ? "s" : ""}.</p>
          <Button onClick={() => router.push(`/festivals/${id}/programme`)}>
            Voir le programme
          </Button>
        </div>
      )}

      {remaining.length > 0 && (
        <div className="flex flex-col gap-4">
          {remaining.map((film) => (
            <TMDbMatchCard
              key={film.id}
              festivalId={id}
              film={film}
              onDone={handleDone}
            />
          ))}
          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={() => router.push(`/festivals/${id}/programme`)}
            >
              Passer + voir le programme
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
