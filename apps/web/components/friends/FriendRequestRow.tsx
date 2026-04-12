import type { FriendRequest } from "@/lib/types/social";
import { Avatar } from "@/components/common/Avatar";

type FriendRequestRowProps = {
  request: FriendRequest;
  busy?: boolean;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
};

const btnBase =
  "inline-flex h-7 shrink-0 items-center justify-center rounded-md px-2.5 text-[11px] font-semibold leading-none transition";

export function FriendRequestRow({
  request,
  busy = false,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestRowProps) {
  const incoming = request.direction === "incoming";

  return (
    <div className="flex gap-2 rounded-[6px] border border-[var(--zalo-border)]/80 bg-white px-2 py-1.5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="shrink-0 pt-px">
        <Avatar name={request.displayName} size="contact" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium leading-tight text-[var(--zalo-text)]">
              {request.displayName}
            </div>
            <div className="mt-px truncate text-[11px] leading-tight text-[var(--zalo-text-subtle)]">
              @{request.username}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 pt-0.5">
            {incoming ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  className={`${btnBase} border border-[var(--zalo-border)] bg-white text-[var(--zalo-text)] hover:bg-[var(--zalo-surface)] disabled:opacity-45`}
                  onClick={() => onReject?.(request.id)}
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className={`${btnBase} bg-[var(--zalo-blue)] text-white hover:bg-[#0056d6] disabled:opacity-45`}
                  onClick={() => onAccept?.(request.id)}
                >
                  Đồng ý
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={busy}
                className={`${btnBase} border border-[var(--zalo-border)] bg-white text-[var(--zalo-text)] hover:bg-[var(--zalo-surface)] disabled:opacity-45`}
                onClick={() => onCancel?.(request.id)}
              >
                Thu hồi
              </button>
            )}
          </div>
        </div>
        {request.message ? (
          <p className="mt-1 line-clamp-2 border-t border-[var(--zalo-border)]/60 pt-1 text-[12px] leading-snug text-[var(--zalo-text-muted)]">
            {request.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
