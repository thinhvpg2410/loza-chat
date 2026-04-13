import type { MessageReaction } from "@/lib/types/chat";

type ReactionBarProps = {
  reactions: MessageReaction[];
  onToggle: (emoji: string) => void;
  alignEnd?: boolean;
};

const chipBase =
  "inline-flex min-h-[22px] items-center justify-center gap-0.5 rounded-full px-1.5 py-px text-[11px] leading-none " +
  "transition-[background-color,box-shadow,color] duration-150 ease-out motion-reduce:transition-none " +
  "border border-transparent select-none";

export function ReactionBar({ reactions, onToggle, alignEnd }: ReactionBarProps) {
  if (!reactions.length) return null;

  return (
    <div className={`mt-0.5 flex flex-wrap gap-0.5 ${alignEnd ? "justify-end" : "justify-start"}`}>
      {reactions.map((r) => (
        <span key={r.emoji} className="inline-flex items-center gap-px">
          <button
            type="button"
            onClick={() => onToggle(r.emoji)}
            className={`${chipBase} ${
              r.viewerReacted
                ? "bg-[var(--zalo-blue)]/14 text-[var(--zalo-text)] shadow-[inset_0_0_0_1px_rgba(0,104,255,0.38)] hover:bg-[var(--zalo-blue)]/18 active:bg-[var(--zalo-blue)]/22"
                : "bg-black/[0.045] text-[var(--zalo-text)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] hover:bg-black/[0.07] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] active:bg-black/[0.1]"
            }`}
          >
            <span className="translate-y-px">{r.emoji}</span>
            <span
              className={`tabular-nums text-[10px] ${
                r.viewerReacted ? "font-medium text-[var(--zalo-blue)]" : "text-[var(--zalo-text-muted)]"
              }`}
            >
              {r.count}
            </span>
          </button>
          {r.viewerReacted ? (
            <button
              type="button"
              aria-label="Bỏ cảm xúc"
              title="Bỏ cảm xúc"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(r.emoji);
              }}
              className="flex h-[22px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none text-[var(--zalo-text-muted)] hover:bg-black/[0.08] hover:text-[var(--zalo-text)] active:bg-black/[0.12]"
            >
              ×
            </button>
          ) : null}
        </span>
      ))}
    </div>
  );
}
