import type { FriendRequest } from "@/lib/types/social";
import { EmptyState } from "@/components/common/EmptyState";
import { FriendRequestRow } from "@/components/friends/FriendRequestRow";

type FriendRequestsListProps = {
  title: string;
  requests: FriendRequest[];
  emptyTitle: string;
  emptyDescription?: string;
  busyRequestId?: string | null;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
};

export function FriendRequestsList({
  title,
  requests,
  emptyTitle,
  emptyDescription,
  busyRequestId,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestsListProps) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
        {title}
      </h2>
      {requests.length === 0 ? (
        <div className="rounded-[6px] bg-[var(--zalo-surface)]/90">
          <EmptyState
            density="compact"
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {requests.map((r) => (
            <FriendRequestRow
              key={r.id}
              request={r}
              busy={busyRequestId === r.id}
              onAccept={onAccept}
              onReject={onReject}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}
    </section>
  );
}
