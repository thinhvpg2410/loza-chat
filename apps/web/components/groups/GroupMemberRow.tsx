import type { GroupMember } from "@/lib/types/social";
import { Avatar } from "@/components/common/Avatar";
import { ActionMenu, type ActionMenuItem } from "@/components/common/ActionMenu";

function roleLabel(role: GroupMember["role"]): string {
  if (role === "owner") return "Chủ nhóm";
  if (role === "admin") return "Phó nhóm";
  return "Thành viên";
}

type GroupMemberRowProps = {
  member: GroupMember;
  onPromote?: (memberId: string) => void;
  onDemote?: (memberId: string) => void;
  onRemove?: (memberId: string) => void;
};

export function GroupMemberRow({ member, onPromote, onDemote, onRemove }: GroupMemberRowProps) {
  const items: ActionMenuItem[] = [
    { id: "promote", label: "Thăng cấp", onSelect: () => onPromote?.(member.id) },
    { id: "demote", label: "Hạ cấp", onSelect: () => onDemote?.(member.id) },
    { id: "remove", label: "Xóa khỏi nhóm", danger: true, onSelect: () => onRemove?.(member.id) },
  ];

  return (
    <div className="flex items-center gap-1.5 py-1">
      <Avatar name={member.displayName} size="contact" online={member.online} />
      <div className="min-w-0 flex-1 py-px">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-medium leading-tight text-[var(--zalo-text)]">
            {member.displayName}
          </span>
          <span className="shrink-0 rounded px-1 py-px text-[9px] font-medium leading-none text-[var(--zalo-text-muted)] ring-1 ring-[var(--zalo-border)]/80 ring-inset">
            {roleLabel(member.role)}
          </span>
        </div>
        <div className="truncate text-[11px] leading-tight text-[var(--zalo-text-subtle)]">
          @{member.username}
        </div>
      </div>
      {member.userId === "me" ? null : (
        <ActionMenu items={items} ariaLabel="Quản lý thành viên" compact />
      )}
    </div>
  );
}
