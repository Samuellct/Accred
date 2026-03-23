import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// middleware leger : uniquement verification JWT, pas d'acces DB
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
