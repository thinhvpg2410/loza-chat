import { formatFileSize } from "@/lib/format-file-size";
import { IconDocument, IconDownload } from "@/components/chat/icons";

type FileMessageProps = {
  fileName: string;
  fileSizeBytes: number;
  isOwn: boolean;
  onDownload?: () => void;
};

export function FileMessage({ fileName, fileSizeBytes, isOwn, onDownload }: FileMessageProps) {
  return (
    <div
      className={`flex max-w-[min(100%,320px)] items-center gap-2.5 rounded-md px-2.5 py-2 ${
        isOwn
          ? "bg-white/15 ring-1 ring-white/25"
          : "bg-[var(--zalo-surface)] ring-1 ring-black/[0.08]"
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
        <p
          className={`truncate text-[13px] font-medium ${isOwn ? "text-white" : "text-[var(--zalo-text)]"}`}
        >
          {fileName}
        </p>
        <p className={`text-[11px] ${isOwn ? "text-white/75" : "text-[var(--zalo-text-muted)]"}`}>
          {formatFileSize(fileSizeBytes)}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDownload?.();
        }}
        className={`shrink-0 rounded-md p-1.5 transition ${
          isOwn
            ? "text-white/90 hover:bg-white/15"
            : "text-[var(--zalo-text-muted)] hover:bg-black/[0.06] hover:text-[var(--zalo-blue)]"
        }`}
        title="Tải xuống"
      >
        <IconDownload className="h-5 w-5" />
      </button>
    </div>
  );
}
