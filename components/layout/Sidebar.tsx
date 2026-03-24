"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Festival {
  id: number;
  name: string;
  edition: string | null;
  startDate: string;
  endDate: string;
  status: string;
}

interface Props {
  festival: Festival;
}

function formatDateShort(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(
    new Date(dateStr)
  );
}

const IconProgramme = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="8" y1="4" x2="8" y2="2" />
    <line x1="16" y1="4" x2="16" y2="2" />
  </svg>
);
const IconSelection = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const IconNote = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconJournal = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);
const IconStats = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const IconImport = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export default function Sidebar({ festival }: Props) {
  const pathname = usePathname();
  const base = `/festivals/${festival.id}`;

  const items = [
    { href: `${base}/programme`, label: "Programme", icon: <IconProgramme /> },
    { href: `${base}/selection`, label: "Ma selection", icon: <IconSelection /> },
    { href: `${base}/journal/new`, label: "Nouvelle note", icon: <IconNote />, accent: true },
    { href: `${base}/journal`, label: "Journal", icon: <IconJournal /> },
    { href: `${base}/stats`, label: "Statistiques", icon: <IconStats /> },
    { href: `${base}/import`, label: "Importer", icon: <IconImport /> },
  ];

  function isActive(href: string) {
    if (href.endsWith("/journal/new")) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden md:flex flex-col w-56 bg-brun text-parchemin min-h-screen shrink-0">
      {/* infos festival */}
      <div className="px-4 py-6 border-b border-parchemin/10">
        <h2 className="font-serif text-base leading-snug text-parchemin">{festival.name}</h2>
        {festival.edition && (
          <p className="text-gris-c text-xs mt-0.5">{festival.edition}</p>
        )}
        <p className="text-gris-c text-xs mt-1">
          {formatDateShort(festival.startDate)} – {formatDateShort(festival.endDate)}
        </p>
      </div>

      {/* navigation */}
      <nav className="flex-1 py-3">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest transition-colors duration-[0.15s] border-l-2
                ${active
                  ? "text-parchemin bg-noir/20 border-or"
                  : item.accent
                  ? "text-or-chaud hover:text-parchemin border-transparent"
                  : "text-gris-c hover:text-parchemin border-transparent"
                }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* lien retour liste */}
      <div className="px-4 py-4 border-t border-parchemin/10">
        <Link
          href="/"
          className="text-gris-c text-xs uppercase tracking-widest hover:text-parchemin transition-colors duration-[0.15s]"
        >
          ← Tous les festivals
        </Link>
      </div>
    </aside>
  );
}
