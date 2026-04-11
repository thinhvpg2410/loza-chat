import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  size?: "md" | "sm";
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    variant === "primary"
      ? "bg-[var(--zalo-blue)] text-white hover:bg-[#0056d6] disabled:opacity-60"
      : "border border-[var(--zalo-border-soft)] bg-white text-[var(--zalo-text)] hover:bg-[var(--zalo-surface)] disabled:opacity-60";
  const sizeClass =
    size === "sm" ? "h-9 px-3 text-xs font-semibold" : "h-11 px-4 text-sm font-semibold";
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--zalo-blue)]/25 ${sizeClass} ${base} ${className}`}
      {...props}
    />
  );
}
