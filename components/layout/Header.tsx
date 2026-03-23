import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Header() {
  return (
    <header className="bg-noir text-parchemin px-6 py-3 flex items-center justify-between">
      <Link
        href="/"
        className="font-serif text-sm tracking-widest text-parchemin hover:text-or transition-colors duration-[0.15s]"
      >
        Accred
      </Link>
      <LogoutButton />
    </header>
  );
}
