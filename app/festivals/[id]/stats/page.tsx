"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import RatingStars from "@/components/journal/RatingStars";
import { formatRating } from "@/lib/journal";
import { computeFestivalStats } from "@/lib/stats";
import type { FestivalStats, StatLog, StatFilm, StatSeance } from "@/lib/stats";

interface ApiLog {
  id: number;
  filmId: number | null;
  rating: number | null;
  tags: string | null;
  film: {
    id: number;
    director: string | null;
    duration: number | null;
    genres: string | null;
    countries: string | null;
  } | null;
}

interface ApiSeance {
  filmId: number | null;
  section: string | null;
}

function BarRow({ label, count, max, pct }: { label: string; count: number; max: number; pct?: number }) {
  const width = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-brun w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-creme-f h-4 relative">
        <div className="bg-or h-full transition-all duration-300" style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs text-gris-c tabular-nums w-10 text-right">
        {pct != null ? `${pct}%` : count}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-parchemin border border-or/25 px-4 py-4 mb-4">
      <h3 className="font-serif text-brun text-base mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function StatsPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<FestivalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [logsRes, seancesRes] = await Promise.all([
          fetch(`/api/festivals/${id}/journal`),
          fetch(`/api/festivals/${id}/seances`),
        ]);
        const apiLogs = await logsRes.json() as ApiLog[];
        const apiSeances = await seancesRes.json() as ApiSeance[];

        // extraire les films uniques depuis les logs
        const filmMap = new Map<number, StatFilm>();
        for (const l of apiLogs) {
          if (l.film && l.filmId) {
            filmMap.set(l.filmId, {
              id: l.film.id,
              director: l.film.director,
              duration: l.film.duration,
              genres: l.film.genres,
              countries: l.film.countries,
            });
          }
        }

        const logs: StatLog[] = apiLogs.map((l) => ({
          id: l.id,
          filmId: l.filmId,
          rating: l.rating,
          tags: l.tags,
        }));
        const films: StatFilm[] = Array.from(filmMap.values());
        const seances: StatSeance[] = apiSeances.map((s) => ({
          filmId: s.filmId,
          section: s.section,
        }));

        setStats(computeFestivalStats(logs, films, seances));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) {
    return <div className="px-4 py-6"><p className="text-gris-c text-sm">Chargement...</p></div>;
  }

  if (!stats || stats.totalFilms === 0) {
    return (
      <div className="px-4 py-6">
        <h2 className="font-serif text-2xl text-brun mb-4">Statistiques</h2>
        <p className="text-gris-c text-sm">Aucune donnee. Commencez a noter des films depuis le journal.</p>
      </div>
    );
  }

  const totalH = Math.floor(stats.totalMinutes / 60);
  const totalMin = stats.totalMinutes % 60;
  const maxHistCount = Math.max(...stats.ratingHistogram.map((b) => b.count), 1);
  const maxGenreCount = stats.genreBreakdown[0]?.count ?? 1;
  const maxCountryCount = stats.countryBreakdown[0]?.count ?? 1;
  const maxSectionCount = stats.sectionBreakdown[0]?.count ?? 1;
  const totalGenres = stats.genreBreakdown.reduce((a, b) => a + b.count, 0);
  const totalCountries = stats.countryBreakdown.reduce((a, b) => a + b.count, 0);
  const totalSections = stats.sectionBreakdown.reduce((a, b) => a + b.count, 0);

  return (
    <div className="px-4 py-4 max-w-2xl">
      <h2 className="font-serif text-2xl text-brun mb-5">Statistiques</h2>

      {/* stat hero */}
      <div className="bg-parchemin border border-or/25 px-6 py-6 mb-4 text-center">
        <p className="font-serif text-5xl text-brun">{stats.totalFilms}</p>
        <p className="font-serif text-lg text-gris-c mt-1">film{stats.totalFilms > 1 ? "s" : ""} vus</p>
        <p className="text-sm text-gris-c mt-2">
          {totalH > 0 ? `${totalH}h ` : ""}{totalMin}min de cinema
        </p>
        {stats.averageRating != null && (
          <div className="flex flex-col items-center mt-4 gap-1">
            <RatingStars value={stats.averageRating} readOnly size="sm" />
            <span className="text-or text-sm tabular-nums">{formatRating(stats.averageRating)} / 5 en moyenne</span>
          </div>
        )}
        {stats.satisfactionRate != null && (
          <p className="text-gris-c text-xs mt-2">{stats.satisfactionRate}% de notes &gt;= 3,5</p>
        )}
      </div>

      {/* histogramme notes */}
      {stats.ratingHistogram.some((b) => b.count > 0) && (
        <Section title="Distribution des notes">
          {stats.ratingHistogram.map((b) => (
            <BarRow key={b.bucket} label={`${b.bucket} ★`} count={b.count} max={maxHistCount} />
          ))}
        </Section>
      )}

      {/* genres */}
      {stats.genreBreakdown.length > 0 && (
        <Section title="Genres">
          {stats.genreBreakdown.slice(0, 8).map((g) => (
            <BarRow
              key={g.name}
              label={g.name}
              count={g.count}
              max={maxGenreCount}
              pct={Math.round((g.count / totalGenres) * 100)}
            />
          ))}
        </Section>
      )}

      {/* pays */}
      {stats.countryBreakdown.length > 0 && (
        <Section title="Pays">
          {stats.countryBreakdown.slice(0, 8).map((c) => (
            <BarRow
              key={c.name}
              label={c.name}
              count={c.count}
              max={maxCountryCount}
              pct={Math.round((c.count / totalCountries) * 100)}
            />
          ))}
        </Section>
      )}

      {/* sections */}
      {stats.sectionBreakdown.length > 0 && (
        <Section title="Sections">
          {stats.sectionBreakdown.map((s) => (
            <BarRow
              key={s.name}
              label={s.name}
              count={s.count}
              max={maxSectionCount}
              pct={Math.round((s.count / totalSections) * 100)}
            />
          ))}
        </Section>
      )}

      {/* top realisateurs */}
      {stats.topDirectors.length > 0 && (
        <Section title="Realisateurs">
          <div className="space-y-2">
            {stats.topDirectors.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-gris-c text-xs tabular-nums w-4">{i + 1}.</span>
                <span className="font-serif text-brun text-sm flex-1 truncate">{d.name}</span>
                <span className="text-gris-c text-xs tabular-nums">{d.count} film{d.count > 1 ? "s" : ""}</span>
                {d.avgRating != null && (
                  <span className="text-or text-xs tabular-nums">{formatRating(d.avgRating)}</span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* tags */}
      {stats.tagBreakdown.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-2">
            {stats.tagBreakdown.map((t) => (
              <span
                key={t.name}
                className="text-xs border border-or/25 px-2 py-0.5 text-gris-c"
              >
                #{t.name} <span className="tabular-nums text-or">{t.count}</span>
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
