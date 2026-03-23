import type { NextAuthConfig } from "next-auth";

// config legere -- pas d'import DB, utilisee par le middleware (Edge Runtime)
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
