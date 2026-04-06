import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ className = "", variant = "primary", type = "button", ...props }: ButtonProps) {
  const base =
    variant === "primary"
      ? "bg-[var(--zalo-blue)] text-white hover:bg-[#0056d6] disabled:opacity-60"
      : "border border-[var(--zalo-border-soft)] bg-white text-[var(--zalo-text)] hover:bg-[var(--zalo-surface)] disabled:opacity-60";
  return (
    <button
      type={type}
      className={`inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--zalo-blue)]/25 ${base} ${className}`}
      {...props}
    />
  );
}
