"use client";

import { IconMore, IconReply, IconSmile } from "@/components/chat/icons";
import { quickReactionEmojis } from "@/lib/mock-stickers";

type MessageActionsProps = {
  onReply: () => void;
  /** Chọn cảm xúc (hover nút react để mở lưới emoji). */
  onPickReaction: (emoji: string) => void;
  onMore?: () => void;
  visible: boolean;
};

export function MessageActions({ onReply, onPickReaction, onMore, visible }: MessageActionsProps) {
  if (!visible) return null;

  return (
    <div className="flex items-center gap-px rounded-md border border-black/[0.06] bg-white/95 px-0.5 py-0.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-sm">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onReply();
        }}
        className="rounded p-1 text-[var(--zalo-text-muted)] transition-colors duration-150 ease-out hover:bg-black/[0.06] hover:text-[var(--zalo-blue)] active:bg-black/[0.08] motion-reduce:transition-none"
        title="Trả lời"
      >
        <IconReply className="h-4 w-4" />
      </button>

      <div className="group/reactPick relative">
        <button
          type="button"
          className="rounded p-1 text-[var(--zalo-text-muted)] transition-colors duration-150 ease-out hover:bg-black/[0.06] hover:text-[var(--zalo-blue)] active:bg-black/[0.08] motion-reduce:transition-none"
          title="Cảm xúc"
        >
          <IconSmile className="h-4 w-4" />
        </button>
        <div
          className="invisible absolute bottom-full left-1/2 z-30 mb-1 flex w-max -translate-x-1/2 gap-px rounded-md bg-white/95 p-0.5 opacity-0 shadow-[0_1px_4px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.06] backdrop-blur-sm transition-[opacity,visibility] duration-150 ease-out group-hover/reactPick:visible group-hover/reactPick:opacity-100 motion-reduce:transition-none"
          role="presentation"
          onClick={(e) => e.stopPropagation()}
        >
          {quickReactionEmojis.map((e) => (
            <button
              key={e}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded text-lg transition-colors duration-150 ease-out hover:bg-black/[0.06] active:bg-black/[0.09] motion-reduce:transition-none"
              onClick={(ev) => {
                ev.stopPropagation();
                onPickReaction(e);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onMore?.();
        }}
        className="rounded p-1 text-[var(--zalo-text-muted)] transition-colors duration-150 ease-out hover:bg-black/[0.06] active:bg-black/[0.08] motion-reduce:transition-none"
        title="Thêm"
      >
        <IconMore className="h-4 w-4" />
      </button>
    </div>
  );
}
