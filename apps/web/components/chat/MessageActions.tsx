"use client";

import { useEffect, useRef, useState } from "react";
import { ActionMenu, type ActionMenuItem } from "@/components/common/ActionMenu";
import { IconReply, IconSmile } from "@/components/chat/icons";
import { quickReactionEmojis } from "@/lib/mock-stickers";

type MessageActionsProps = {
  onReply: () => void;
  /** Chọn cảm xúc (hover nút react để mở lưới emoji). */
  onPickReaction: (emoji: string) => void;
  moreItems?: ActionMenuItem[];
  visible: boolean;
};

export function MessageActions({ onReply, onPickReaction, moreItems = [], visible }: MessageActionsProps) {
  const [reactionOpen, setReactionOpen] = useState(false);
  const [reactionIndex, setReactionIndex] = useState(0);
  const reactionButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!reactionOpen) return;
    queueMicrotask(() => reactionButtonRefs.current[reactionIndex]?.focus());
  }, [reactionIndex, reactionOpen]);

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
          aria-expanded={reactionOpen}
          aria-haspopup="menu"
          className="rounded p-1 text-[var(--zalo-text-muted)] transition-colors duration-150 ease-out hover:bg-black/[0.06] hover:text-[var(--zalo-blue)] active:bg-black/[0.08] motion-reduce:transition-none"
          title="Cảm xúc"
          onClick={(e) => {
            e.stopPropagation();
            setReactionOpen((v) => !v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
              e.preventDefault();
              setReactionOpen(true);
            }
          }}
        >
          <IconSmile className="h-4 w-4" />
        </button>
        <div
          className={`absolute bottom-full left-1/2 z-30 mb-1 flex w-max -translate-x-1/2 gap-px rounded-md bg-white/95 p-0.5 shadow-[0_1px_4px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.06] backdrop-blur-sm transition-[opacity,visibility] duration-150 ease-out motion-reduce:transition-none ${
            reactionOpen
              ? "visible opacity-100"
              : "invisible opacity-0 group-hover/reactPick:visible group-hover/reactPick:opacity-100"
          }`}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setReactionOpen(false);
              return;
            }
            if (e.key === "ArrowRight" || e.key === "Tab") {
              e.preventDefault();
              setReactionIndex((prev) => (prev + 1) % quickReactionEmojis.length);
              return;
            }
            if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) {
              e.preventDefault();
              setReactionIndex((prev) => (prev - 1 + quickReactionEmojis.length) % quickReactionEmojis.length);
            }
          }}
        >
          {quickReactionEmojis.map((e, idx) => (
            <button
              key={e}
              ref={(el) => {
                reactionButtonRefs.current[idx] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={reactionIndex === idx ? 0 : -1}
              className="flex h-8 w-8 items-center justify-center rounded text-lg transition-colors duration-150 ease-out hover:bg-black/[0.06] active:bg-black/[0.09] motion-reduce:transition-none"
              onClick={(ev) => {
                ev.stopPropagation();
                onPickReaction(e);
                setReactionOpen(false);
              }}
              onFocus={() => setReactionIndex(idx)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {moreItems.length > 0 ? (
        <div onClick={(e) => e.stopPropagation()}>
          <ActionMenu items={moreItems} ariaLabel="Thao tác tin nhắn" compact />
        </div>
      ) : null}
    </div>
  );
}
