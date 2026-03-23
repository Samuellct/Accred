"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-gris-c text-xs uppercase tracking-widest font-sans hover:text-parchemin transition-colors duration-[0.15s]"
    >
      Déconnexion
    </button>
  );
}
