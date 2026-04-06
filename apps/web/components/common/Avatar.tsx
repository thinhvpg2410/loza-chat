type AvatarProps = {
  name: string;
  /** `contact` ≈40px — dense list rows (e.g. friends). `md` ≈44px. */
  size?: "sm" | "contact" | "md" | "lg";
  online?: boolean;
  className?: string;
};

const sizeClass: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-9 w-9 text-[12px]",
  contact: "h-10 w-10 text-[12px]",
  md: "h-11 w-11 text-[13px]",
  lg: "h-16 w-16 text-xl",
};

export function Avatar({ name, size = "md", online, className = "" }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase();
  const dotSm = size === "sm" || size === "contact";
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#7eb6ff] to-[var(--zalo-blue)] font-semibold text-white ${sizeClass[size]}`}
      >
        {initial}
      </div>
      {online ? (
        <span
          className={
            dotSm
              ? "absolute bottom-px right-px h-2 w-2 rounded-full border-[1.5px] border-white bg-emerald-500"
              : "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"
          }
          title="Đang hoạt động"
        />
      ) : null}
    </div>
  );
}
