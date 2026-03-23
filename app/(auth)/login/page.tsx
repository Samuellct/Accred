"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Mot de passe incorrect");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-creme flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        {/* logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl tracking-widest text-brun">
            Accred
          </h1>
          <p className="mt-1 text-gris-c text-xs uppercase tracking-widest font-sans">
            Compagnon festival
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            autoComplete="current-password"
            required
            className="
              w-full bg-parchemin border border-creme-f
              px-4 py-3 text-sm text-brun font-sans
              placeholder-gris-c
              focus:outline-none focus:border-or
              transition-colors duration-[0.15s]
            "
          />

          {error && (
            <p className="text-or text-xs font-sans tracking-wide">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full bg-noir text-parchemin
              px-4 py-3 text-xs uppercase tracking-widest font-sans
              hover:bg-brun disabled:opacity-50
              transition-colors duration-[0.15s]
            "
          >
            {loading ? "..." : "Entrer"}
          </button>
        </form>
      </div>
    </div>
  );
}
