import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = "", id, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-xs uppercase tracking-widest text-gris-c mb-1.5 block"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full bg-parchemin border ${error ? "border-or" : "border-creme-f"} text-brun px-4 py-2.5 text-sm focus:border-or focus:outline-none transition-colors duration-[0.15s] ${className}`}
        {...props}
      />
      {error && <p className="text-or text-xs mt-1">{error}</p>}
    </div>
  );
}
