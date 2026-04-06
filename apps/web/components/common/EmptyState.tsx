import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Lighter, denser copy for list panels (e.g. friend requests). */
  density?: "comfortable" | "compact";
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  density = "comfortable",
}: EmptyStateProps) {
  const compact = density === "compact";

  return (
    <div
      className={
        compact
          ? "flex flex-col items-center justify-center px-4 py-7 text-center"
          : "flex flex-col items-center justify-center px-6 py-14 text-center"
      }
    >
      {icon ? (
        <div
          className={
            compact
              ? "mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--zalo-surface)] text-[var(--zalo-text-muted)]"
              : "mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--zalo-surface)] text-[var(--zalo-text-muted)]"
          }
        >
          {icon}
        </div>
      ) : null}
      <p
        className={
          compact
            ? "text-[13px] font-medium text-[var(--zalo-text-muted)]"
            : "text-[14px] font-semibold text-[var(--zalo-text)]"
        }
      >
        {title}
      </p>
      {description ? (
        <p
          className={
            compact
              ? "mt-1 max-w-[260px] text-[12px] leading-relaxed text-[var(--zalo-text-subtle)]"
              : "mt-1 max-w-xs text-[13px] leading-snug text-[var(--zalo-text-muted)]"
          }
        >
          {description}
        </p>
      ) : null}
      {action ? <div className={compact ? "mt-3" : "mt-4"}>{action}</div> : null}
    </div>
  );
}
