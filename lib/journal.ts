// helpers purs pour le journal -- utilisables cote client et serveur

export const PREDEFINED_TAGS = [
  "emouvant",
  "surprenant",
  "decevant",
  "chef-oeuvre",
  "a-revoir",
];

// calcule la note (0.5-5.0) depuis la position du tap sur une etoile
// tapX : position horizontale du tap dans le conteneur de l'etoile
// starWidth : largeur totale de l'etoile
// starIndex : index 0-based de l'etoile cliquee
export function computeRating(tapX: number, starWidth: number, starIndex: number): number {
  const isLeftHalf = tapX < starWidth / 2;
  const raw = isLeftHalf ? starIndex + 0.5 : starIndex + 1;
  // clamp 0.5-5.0
  return Math.min(5, Math.max(0.5, raw));
}

export function isValidRating(v: number): boolean {
  if (v < 0.5 || v > 5) return false;
  // doit etre un multiple de 0.5
  return Math.round(v * 2) === v * 2;
}

export function formatRating(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1).replace(".", ",");
}
