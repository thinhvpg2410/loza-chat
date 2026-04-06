type StickerMessageProps = {
  emoji: string;
};

export function StickerMessage({ emoji }: StickerMessageProps) {
  return (
    <div className="select-none text-[96px] leading-none tracking-normal" aria-hidden>
      {emoji}
    </div>
  );
}
