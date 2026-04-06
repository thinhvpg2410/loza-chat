import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, action, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-2 px-1 ${className}`}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
        {title}
      </h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
