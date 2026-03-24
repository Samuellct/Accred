"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface Film {
  id: number;
  title: string;
  posterPath: string | null;
  duration: number | null;
}

interface SelectionRow {
  seance: {
    id: number;
    dateTime: string;
    venue: string | null;
  };
  film: Film | null;
}

interface SeanceState {
  type: "upcoming" | "current" | "ended";
  filmId: number | null;
  filmTitle: string;
  posterPath: string | null;
  venue: string | null;
  dateTime: string;
  duration: number; // minutes
}

const DEFAULT_DURATION = 120;

function formatCountdown(diffMs: number): string {
  const totalMin = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h${m > 0 ? m.toString().padStart(2, "0") : ""}`;
  return `${m}min`;
}

function computeState(sels: SelectionRow[]): SeanceState | null {
  const now = Date.now();
  const sorted = [...sels].sort((a, b) => a.seance.dateTime.localeCompare(b.seance.dateTime));

  for (const s of sorted) {
    const start = new Date(s.seance.dateTime).getTime();
    const dur = (s.film?.duration ?? DEFAULT_DURATION) * 60000;
    const end = start + dur;

    if (now >= start && now < end) {
      return {
        type: "current",
        filmId: s.film?.id ?? null,
        filmTitle: s.film?.title ?? "Film inconnu",
        posterPath: s.film?.posterPath ?? null,
        venue: s.seance.venue,
        dateTime: s.seance.dateTime,
        duration: s.film?.duration ?? DEFAULT_DURATION,
      };
    }

    // terminee depuis moins de 30min
    if (now >= end && now < end + 30 * 60000) {
      return {
        type: "ended",
        filmId: s.film?.id ?? null,
        filmTitle: s.film?.title ?? "Film inconnu",
        posterPath: s.film?.posterPath ?? null,
        venue: s.seance.venue,
        dateTime: s.seance.dateTime,
        duration: s.film?.duration ?? DEFAULT_DURATION,
      };
    }

    // a venir
    if (now < start) {
      return {
        type: "upcoming",
        filmId: s.film?.id ?? null,
        filmTitle: s.film?.title ?? "Film inconnu",
        posterPath: s.film?.posterPath ?? null,
        venue: s.seance.venue,
        dateTime: s.seance.dateTime,
        duration: s.film?.duration ?? DEFAULT_DURATION,
      };
    }
  }

  return null;
}

interface Props {
  festivalId: number;
  status: string;
}

export default function NextSeance({ festivalId, status }: Props) {
  const [selections, setSelections] = useState<SelectionRow[]>([]);
  const [state, setState] = useState<SeanceState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (status !== "active") return;
    void fetch(`/api/festivals/${festivalId}/selections`)
      .then((r) => r.json())
      .then((data: SelectionRow[]) => {
        setSelections(data);
        setState(computeState(data));
      });
  }, [festivalId, status]);

  // refresh countdown chaque minute
  useEffect(() => {
    if (selections.length === 0) return;
    intervalRef.current = setInterval(() => {
      setState(computeState(selections));
    }, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [selections]);

  // programmer les notifications locales
  useEffect(() => {
    // cleanup timers precedents
    notifTimers.current.forEach(clearTimeout);
    notifTimers.current = [];

    if (!("Notification" in window) || selections.length === 0) return;

    void (async () => {
      // demander la permission si pas encore fait
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission !== "granted") return;

      const sw = await navigator.serviceWorker.ready.catch(() => null);
      if (!sw) return;

      const now = Date.now();
      const today = new Date().toISOString().slice(0, 10);

      for (const s of selections) {
        if (!s.seance.dateTime.startsWith(today)) continue;
        const filmTitle = s.film?.title ?? "Film inconnu";
        const filmId = s.film?.id;
        const start = new Date(s.seance.dateTime).getTime();
        const dur = (s.film?.duration ?? DEFAULT_DURATION) * 60000;
        const end = start + dur;

        // rappel 15min avant
        const notifBefore = start - 15 * 60000 - now;
        if (notifBefore > 0) {
          const t = setTimeout(() => {
            void sw.showNotification(`Dans 15min : ${filmTitle}`, {
              body: s.seance.venue ?? "",
              icon: "/icons/icon-192.png",
              data: { url: `/festivals/${festivalId}/programme` },
            } as NotificationOptions);
          }, notifBefore);
          notifTimers.current.push(t);
        }

        // notif post-seance
        const notifAfter = end - now;
        if (notifAfter > 0 && filmId) {
          const t = setTimeout(() => {
            void sw.showNotification(`Film termine : ${filmTitle}`, {
              body: "Envie de le noter ?",
              icon: "/icons/icon-192.png",
              data: { url: `/festivals/${festivalId}/journal/new?filmId=${filmId}` },
            } as NotificationOptions);
          }, notifAfter);
          notifTimers.current.push(t);
        }
      }
    })();

    return () => { notifTimers.current.forEach(clearTimeout); };
  }, [selections, festivalId]);

  if (status !== "active" || !state) return null;

  return (
    <div className="bg-noir text-parchemin border-b border-or/20 px-4 py-2.5 flex items-center gap-3">
      {/* poster mini */}
      {state.posterPath ? (
        <div className="relative flex-shrink-0 w-9" style={{ height: "48px" }}>
          <Image src={state.posterPath} alt={state.filmTitle} fill unoptimized className="object-cover" sizes="36px" />
        </div>
      ) : (
        <div className="w-9 h-12 flex-shrink-0 bg-parchemin/10 flex items-center justify-center">
          <span className="text-gris-c text-[0.55rem]">?</span>
        </div>
      )}

      {/* infos */}
      <div className="flex-1 min-w-0">
        {state.type === "upcoming" && (
          <>
            <p className="font-serif text-sm text-parchemin truncate">{state.filmTitle}</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              {state.venue && <span className="text-gris-c text-xs truncate">{state.venue}</span>}
              <span className="text-or-chaud text-xs tabular-nums flex-shrink-0">
                Dans {formatCountdown(new Date(state.dateTime).getTime() - Date.now())}
              </span>
            </div>
          </>
        )}
        {state.type === "current" && (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-or-chaud text-[0.6rem] uppercase tracking-widest">En cours</span>
              {state.venue && <span className="text-gris-c text-xs truncate">{state.venue}</span>}
            </div>
            <p className="font-serif text-sm text-parchemin truncate mt-0.5">{state.filmTitle}</p>
          </>
        )}
        {state.type === "ended" && (
          <p className="font-serif text-sm text-parchemin truncate">{state.filmTitle}</p>
        )}
      </div>

      {/* action */}
      {state.type === "ended" && state.filmId && (
        <Link
          href={`/festivals/${festivalId}/journal/new?filmId=${state.filmId}`}
          className="flex-shrink-0 text-[0.6rem] uppercase tracking-widest bg-or text-parchemin px-3 py-1.5 hover:bg-or-chaud transition-colors duration-[0.15s]"
        >
          Noter
        </Link>
      )}
    </div>
  );
}
