"use client";

import { useEffect, useState } from "react";

type TypingIndicatorProps = {
  label?: string;
};

export function TypingIndicator({ label = "Đang nhập" }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-[var(--zalo-text-muted)]">
      <span>{label}</span>
      <span className="inline-flex gap-0.5">
        <span className="typing-dot inline-block h-1 w-1 animate-bounce rounded-full bg-[var(--zalo-text-muted)] [animation-delay:-0.2s]" />
        <span className="typing-dot inline-block h-1 w-1 animate-bounce rounded-full bg-[var(--zalo-text-muted)] [animation-delay:-0.1s]" />
        <span className="typing-dot inline-block h-1 w-1 animate-bounce rounded-full bg-[var(--zalo-text-muted)]" />
      </span>
    </div>
  );
}

/** Remount with `key={conversationId}` so typing animation replays per thread without sync setState in parent effects. */
export function TypingIndicatorSession({ label }: { label?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 900);
    const t2 = window.setTimeout(() => setVisible(false), 4200);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;
  return <TypingIndicator label={label} />;
}

