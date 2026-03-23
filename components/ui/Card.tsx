import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export default function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-parchemin border border-or/25 shadow-sm p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
