import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-noir text-parchemin hover:bg-brun text-xs uppercase tracking-widest px-6 py-2.5 transition-colors duration-[0.15s]",
  secondary:
    "bg-transparent border border-brun/30 text-brun hover:border-or hover:text-or text-xs uppercase tracking-widest px-6 py-2.5 transition-colors duration-[0.15s]",
  tertiary:
    "text-or hover:opacity-70 text-xs uppercase tracking-widest transition-opacity duration-[0.15s]",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-1.5",
  md: "",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const sizeOverride = size === "sm" ? sizes.sm : "";
  return (
    <button
      className={`${styles[variant]} ${sizeOverride} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
}
