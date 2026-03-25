import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Header() {
  return (
    <header className="bg-noir text-parchemin px-4 py-3 flex items-center justify-between gap-3">
      <Link
        href="/"
        className="font-serif text-sm tracking-widest text-parchemin hover:text-or transition-colors duration-[0.15s] flex-shrink-0"
      >
        Accred
      </Link>
      <nav className="flex items-center gap-4 min-w-0 overflow-hidden">
        <Link href="/archive" className="text-xs uppercase tracking-widest text-parchemin/60 hover:text-or transition-colors duration-[0.15s] truncate">Archive</Link>
        <Link href="/search" className="text-xs uppercase tracking-widest text-parchemin/60 hover:text-or transition-colors duration-[0.15s] truncate">Recherche</Link>
        <Link href="/timeline" className="text-xs uppercase tracking-widest text-parchemin/60 hover:text-or transition-colors duration-[0.15s] truncate">Timeline</Link>
      </nav>
      <LogoutButton />
    </header>
  );
}
