"use client";

import { computeRating } from "@/lib/journal";

interface Props {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}

// rendu d'une etoile SVG avec fill partiel via clipPath
function Star({ fill, sizePx, id }: { fill: "full" | "half" | "empty"; sizePx: number; id: string }) {
  const clipId = `star-clip-${id}`;
  return (
    <svg width={sizePx} height={sizePx} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
      {fill === "half" && (
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
      )}
      {/* contour vide -- variables Tailwind 4 avec prefixe --color- */}
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="none"
        stroke="var(--color-gris-c)"
        strokeWidth="1.5"
      />
      {/* remplissage */}
      {(fill === "full" || fill === "half") && (
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="var(--color-or-chaud)"
          stroke="var(--color-or-chaud)"
          strokeWidth="1.5"
          clipPath={fill === "half" ? `url(#${clipId})` : undefined}
        />
      )}
    </svg>
  );
}

export default function RatingStars({ value, onChange, readOnly = false, size = "md" }: Props) {
  const sizePx = size === "sm" ? 20 : 32;
  // zone tap plus large que le SVG pour atteindre 44px min
  const tapSize = Math.max(44, sizePx);

  function getFill(starIndex: number): "full" | "half" | "empty" {
    const starValue = starIndex + 1; // 1-5
    if (value >= starValue) return "full";
    if (value >= starValue - 0.5) return "half";
    return "empty";
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>, starIndex: number) {
    if (!onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const newRating = computeRating(tapX, rect.width, starIndex);
    // re-clic sur la valeur courante = reset a 0
    if (newRating === value) {
      onChange(0);
    } else {
      onChange(newRating);
    }
  }

  return (
    <div className="flex items-center gap-1" aria-label={`Note : ${value} sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        if (readOnly) {
          return (
            <div key={i} style={{ width: tapSize, height: tapSize, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Star fill={getFill(i)} sizePx={sizePx} id={`ro-${i}`} />
            </div>
          );
        }
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => handleClick(e, i)}
            style={{ width: tapSize, height: tapSize, display: "flex", alignItems: "center", justifyContent: "center" }}
            className="focus:outline-none"
            aria-label={`${i + 1} etoile${i > 0 ? "s" : ""}`}
          >
            <Star fill={getFill(i)} sizePx={sizePx} id={`star-${i}`} />
          </button>
        );
      })}
    </div>
  );
}
