type StickerMessageProps = {
  emoji: string;
  imageUrl?: string;
};

export function StickerMessage({ emoji, imageUrl }: StickerMessageProps) {
  if (imageUrl) {
    return (
      // Remote sticker assets use arbitrary API URLs; next/image would require host allowlisting.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className="max-h-32 max-w-32 select-none object-contain"
        loading="lazy"
      />
    );
  }
  return (
    <div className="select-none text-[96px] leading-none tracking-normal" aria-hidden>
      {emoji}
    </div>
  );
}
