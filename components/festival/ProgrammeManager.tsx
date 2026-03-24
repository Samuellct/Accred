"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Film {
  id: number;
  title: string;
  director: string | null;
  duration: number | null;
}

interface Seance {
  id: number;
  dateTime: string;
  venue: string | null;
  section: string | null;
  format: string | null;
  film: Film | null;
}

interface Props {
  festivalId: string;
}

function formatDateTime(dt: string): string {
  const d = new Date(dt);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
    + " "
    + d.getHours().toString().padStart(2, "0")
    + "h"
    + d.getMinutes().toString().padStart(2, "0");
}

export default function ProgrammeManager({ festivalId }: Props) {
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editVenue, setEditVenue] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editDateTime, setEditDateTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [festivalId]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/festivals/${festivalId}/seances`);
      const data = await res.json() as Seance[];
      setSeances(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(seanceId: number, filmTitle: string) {
    if (!confirm(`Supprimer la seance de "${filmTitle}" ?`)) return;
    await fetch(`/api/festivals/${festivalId}/seances/${seanceId}`, { method: "DELETE" });
    setSeances((prev) => prev.filter((s) => s.id !== seanceId));
  }

  function startEdit(s: Seance) {
    setEditingId(s.id);
    setEditVenue(s.venue ?? "");
    setEditSection(s.section ?? "");
    // dateTime ISO → input datetime-local format (YYYY-MM-DDTHH:mm)
    setEditDateTime(s.dateTime.slice(0, 16));
  }

  async function saveEdit(seanceId: number) {
    setSaving(true);
    try {
      const res = await fetch(`/api/festivals/${festivalId}/seances/${seanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateTime: editDateTime,
          venue: editVenue || null,
          section: editSection || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json() as Seance;
        setSeances((prev) => prev.map((s) => s.id === seanceId ? { ...s, ...updated } : s));
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  const filtered = seances.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.film?.title.toLowerCase().includes(q) ?? false) ||
      (s.venue?.toLowerCase().includes(q) ?? false) ||
      (s.section?.toLowerCase().includes(q) ?? false)
    );
  });

  if (loading) return <p className="text-gris-c text-sm">Chargement...</p>;

  if (seances.length === 0) {
    return <p className="text-gris-c text-sm">{"Aucune seance dans le programme. Importez depuis l'onglet CSV ou JSON."}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <p className="text-gris-c text-xs">{seances.length} seance{seances.length > 1 ? "s" : ""} au programme</p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer..."
          className="text-xs text-brun bg-parchemin border border-or/25 px-2 py-1.5 focus:outline-none focus:border-or w-40"
        />
      </div>

      <div className="space-y-px">
        {filtered.map((s) => (
          <div key={s.id}>
            {editingId === s.id ? (
              // ligne edition inline
              <div className="bg-creme border border-or/40 px-3 py-3 space-y-2">
                <p className="font-serif text-sm text-brun">{s.film?.title ?? "Film inconnu"}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[0.6rem] uppercase tracking-widest text-gris-c block mb-1">Date/Heure</label>
                    <input
                      type="datetime-local"
                      value={editDateTime}
                      onChange={(e) => setEditDateTime(e.target.value)}
                      className="text-xs text-brun bg-parchemin border border-or/25 px-2 py-1.5 focus:outline-none focus:border-or w-full"
                    />
                  </div>
                  <Input
                    label="Salle"
                    id={`venue-${s.id}`}
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                  />
                  <Input
                    label="Section"
                    id={`section-${s.id}`}
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void saveEdit(s.id)} disabled={saving}>
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              // ligne normale
              <div className="bg-parchemin border border-or/25 px-3 py-2 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-or text-xs tabular-nums flex-shrink-0">{formatDateTime(s.dateTime)}</span>
                    {s.section && (
                      <span className="text-gris-c text-[0.6rem] uppercase tracking-widest truncate">{s.section}</span>
                    )}
                  </div>
                  <p className="font-serif text-brun text-sm truncate">{s.film?.title ?? "Film inconnu"}</p>
                  {s.venue && <p className="text-gris-c text-xs">{s.venue}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(s)}
                    aria-label="Modifier"
                    className="text-gris-c hover:text-or transition-colors duration-[0.15s]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => void handleDelete(s.id, s.film?.title ?? "cette seance")}
                    aria-label="Supprimer"
                    className="text-gris-c hover:text-or-chaud transition-colors duration-[0.15s]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
