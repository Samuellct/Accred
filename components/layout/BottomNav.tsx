"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  festivalId: number;
}

// icones SVG inline minimalistes
const IconProgramme = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="0" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="8" y1="4" x2="8" y2="2" />
    <line x1="16" y1="4" x2="16" y2="2" />
  </svg>
);
const IconSelection = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const IconNote = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconJournal = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);
const IconStats = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export default function BottomNav({ festivalId }: Props) {
  const pathname = usePathname();
  const base = `/festivals/${festivalId}`;

  // 5 boutons max : Programme | Selection | Note (central) | Journal | Stats
  // Import reste accessible via la sidebar desktop
  const items = [
    { href: `${base}/programme`, label: "Programme", icon: <IconProgramme /> },
    { href: `${base}/selection`, label: "Selection", icon: <IconSelection /> },
    { href: `${base}/journal/new`, label: "Note", icon: <IconNote />, accent: true },
    { href: `${base}/journal`, label: "Journal", icon: <IconJournal /> },
    { href: `${base}/stats`, label: "Stats", icon: <IconStats /> },
  ];

  function isActive(href: string) {
    if (href.endsWith("/journal/new")) return false; // jamais "actif"
    // journal : exact match pour ne pas matcher journal/new
    if (href.endsWith("/journal")) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-noir z-50">
      <div className="flex">
        {items.map((item) => {
          const active = isActive(item.href);
          const color = item.accent
            ? "text-or"
            : active
            ? "text-parchemin"
            : "text-gris-c";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors duration-[0.15s] ${color} ${active ? "border-t-2 border-or" : "border-t-2 border-transparent"}`}
            >
              {item.icon}
              <span className="text-[0.55rem] uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
