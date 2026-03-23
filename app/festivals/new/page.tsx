"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function NewFestivalPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const startDate = fd.get("startDate") as string;
    const endDate = fd.get("endDate") as string;
    const location = fd.get("location") as string;
    const edition = fd.get("edition") as string;
    const status = fd.get("status") as string;

    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Le nom est requis";
    if (!startDate) errs.startDate = "La date de debut est requise";
    if (!endDate) errs.endDate = "La date de fin est requise";
    if (startDate && endDate && endDate < startDate)
      errs.endDate = "La date de fin doit etre apres le debut";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/festivals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, startDate, endDate, location, edition, status }),
    });

    if (!res.ok) {
      setErrors({ form: "Erreur lors de la creation" });
      setLoading(false);
      return;
    }

    const festival = await res.json();
    router.push(`/festivals/${festival.id}/programme`);
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl text-brun mb-8">Nouveau festival</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Nom"
          id="name"
          name="name"
          placeholder="Festival de Cannes 2026"
          error={errors.name}
        />
        <Input
          label="Lieu"
          id="location"
          name="location"
          placeholder="Cannes, France"
        />
        <Input
          label="Edition"
          id="edition"
          name="edition"
          placeholder="79e edition"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date de debut"
            id="startDate"
            name="startDate"
            type="date"
            error={errors.startDate}
          />
          <Input
            label="Date de fin"
            id="endDate"
            name="endDate"
            type="date"
            error={errors.endDate}
          />
        </div>

        <div className="w-full">
          <label
            htmlFor="status"
            className="text-xs uppercase tracking-widest text-gris-c mb-1.5 block"
          >
            Statut
          </label>
          <select
            id="status"
            name="status"
            defaultValue="upcoming"
            className="w-full bg-parchemin border border-creme-f text-brun px-4 py-2.5 text-sm focus:border-or focus:outline-none transition-colors duration-[0.15s]"
          >
            <option value="upcoming">A venir</option>
            <option value="active">En cours</option>
            <option value="done">Termine</option>
          </select>
        </div>

        {errors.form && <p className="text-or text-xs">{errors.form}</p>}

        <div className="flex gap-4 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Creation..." : "Creer"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
        </div>
      </form>
    </main>
  );
}
