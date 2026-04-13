import type { GroupSummary } from "@/lib/types/social";
import { Avatar } from "@/components/common/Avatar";

type GroupListRowProps = {
  group: GroupSummary;
  isActive: boolean;
  onSelect: (id: string) => void;
};

export function GroupListRow({ group, isActive, onSelect }: GroupListRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(group.id)}
      className={
        isActive
          ? "flex w-full gap-2.5 rounded-md bg-[var(--zalo-list-active)] px-2 py-2 text-left transition-colors"
          : "flex w-full gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-black/[0.035]"
      }
    >
      <Avatar name={group.name} src={group.avatarUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[14px] font-semibold leading-tight text-[var(--zalo-text)]">
            {group.name}
          </span>
          {group.lastMessageAt ? (
            <span className="shrink-0 text-[11px] tabular-nums text-[var(--zalo-text-muted)]">
              {group.lastMessageAt}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[13px] leading-snug text-[var(--zalo-text-muted)]">
            {group.muted ? (
              <span className="mr-1 inline-block opacity-70" title="Đã tắt thông báo">
                🔕
              </span>
            ) : null}
            {group.lastMessagePreview ?? `${group.memberCount} thành viên`}
          </p>
        </div>
      </div>
    </button>
  );
}
