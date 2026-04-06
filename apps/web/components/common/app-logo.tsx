import Image from "next/image";
import lozaLogo from "@/app/loza-logo.png";

type AppLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Use on the blue rail so the mark stays visible without blending into the background. */
  variant?: "default" | "onBrand";
};

const boxClass: Record<NonNullable<AppLogoProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

const sizeAttr: Record<NonNullable<AppLogoProps["size"]>, string> = {
  sm: "32px",
  md: "40px",
  lg: "56px",
};

export function AppLogo({ className = "", size = "md", variant = "default" }: AppLogoProps) {
  const variantStyles =
    variant === "onBrand"
      ? "border border-white/35 bg-white/10 shadow-none"
      : "bg-white shadow-sm";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md ${boxClass[size]} ${variantStyles} ${className}`}
    >
      <Image
        src={lozaLogo}
        alt="Loza Chat"
        fill
        sizes={sizeAttr[size]}
        className="object-contain p-0.5"
        priority={size === "lg"}
      />
    </span>
  );
}
