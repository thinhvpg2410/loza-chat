type AppLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Use on the blue rail so the mark stays visible without blending into the background. */
  variant?: "default" | "onBrand";
};

const sizeClass: Record<NonNullable<AppLogoProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-xl",
};

export function AppLogo({ className = "", size = "md", variant = "default" }: AppLogoProps) {
  const base = sizeClass[size];
  if (variant === "onBrand") {
    return (
      <div
        className={`flex items-center justify-center rounded-md border border-white/35 bg-white/10 font-bold text-white shadow-none ${base} ${className}`}
      >
        L
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-md bg-[var(--zalo-blue)] font-bold text-white shadow-sm ${base} ${className}`}
    >
      L
    </div>
  );
}
