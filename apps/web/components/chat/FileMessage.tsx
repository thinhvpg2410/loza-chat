import { formatFileSize } from "@/lib/format-file-size";
import { IconDocument, IconDownload } from "@/components/chat/icons";

type FileMessageProps = {
  fileName: string;
  fileSizeBytes: number;
  isOwn: boolean;
  /** When set, clicking the card opens in-app preview (PDF / Office). */
  onPreview?: () => void;
  /** Open file URL (new tab); used for the download icon and as fallback when there is no preview. */
  onOpenExternal?: () => void;
};

export function FileMessage({
  fileName,
  fileSizeBytes,
  isOwn,
  onPreview,
  onOpenExternal,
}: FileMessageProps) {
  const handleCardClick = () => {
    if (onPreview) onPreview();
    else onOpenExternal?.();
  };

  return (
    <div
      className={`flex max-w-[min(100%,320px)] items-center gap-2.5 rounded-md px-2.5 py-2 ${
        isOwn
          ? "bg-white/15 ring-1 ring-white/25"
          : "bg-[var(--zalo-surface)] ring-1 ring-black/[0.08]"
      }`}
    >
      <button
        type="button"
        onClick={handleCardClick}
        className={`flex min-w-0 flex-1 items-center gap-2.5 text-left ${
          isOwn ? "text-white" : "text-[var(--zalo-text)]"
        }`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
            isOwn ? "bg-white/20 text-white" : "bg-white text-[var(--zalo-blue)]"
          }`}
        >
          <IconDocument className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[13px] font-medium ${isOwn ? "text-white" : "text-[var(--zalo-text)]"}`}>
            {fileName}
          </p>
          <p className={`text-[11px] ${isOwn ? "text-white/75" : "text-[var(--zalo-text-muted)]"}`}>
            {formatFileSize(fileSizeBytes)}
            {onPreview ? (
              <span className={`ml-1.5 font-medium ${isOwn ? "text-white/90" : "text-[var(--zalo-blue)]"}`}>
                · Xem
              </span>
            ) : null}
          </p>
        </div>
      </button>
      {onOpenExternal ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenExternal();
          }}
          className={`shrink-0 rounded-md p-1.5 transition ${
            isOwn
              ? "text-white/90 hover:bg-white/15"
              : "text-[var(--zalo-text-muted)] hover:bg-black/[0.06] hover:text-[var(--zalo-blue)]"
          }`}
          title="Mở / tải xuống"
        >
          <IconDownload className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
