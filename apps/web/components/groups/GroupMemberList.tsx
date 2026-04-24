import type { GroupMember } from "@/lib/types/social";
import { SectionHeader } from "@/components/common/SectionHeader";
import { GroupMemberRow } from "@/components/groups/GroupMemberRow";

type GroupMemberListProps = {
  members: GroupMember[];
  viewerUserId?: string | null;
  viewerRole?: "owner" | "admin" | "member";
  canRemoveOthers?: boolean;
  onAddMember?: () => void;
  onPromote?: (memberId: string) => void;
  onDemote?: (memberId: string) => void;
  onRemove?: (memberId: string) => void;
};

export function GroupMemberList({
  members,
  viewerUserId = null,
  viewerRole = "member",
  canRemoveOthers = false,
  onAddMember,
  onPromote,
  onDemote,
  onRemove,
}: GroupMemberListProps) {
  return (
    <div>
      <SectionHeader
        className="px-0"
        title="Thành viên"
        action={
          onAddMember ? (
            <button
              type="button"
              className="text-[11px] font-medium text-[var(--zalo-blue)] hover:underline"
              onClick={onAddMember}
            >
              Thêm
            </button>
          ) : null
        }
      />
      <div className="mt-0.5 flex flex-col divide-y divide-[var(--zalo-border)]/60">
        {members.map((m) => {
          const isSelf = viewerUserId !== null && m.userId === viewerUserId;
          const showRoleMenu = viewerRole === "owner" && !isSelf && m.role !== "owner";
          const showModerationMenu =
            Boolean(onRemove) &&
            canRemoveOthers &&
            !isSelf &&
            m.role !== "owner" &&
            (viewerRole === "owner" || (viewerRole === "admin" && m.role === "member"));
          return (
            <GroupMemberRow
              key={m.id}
              member={m}
              showModerationMenu={showModerationMenu}
              showRoleMenu={showRoleMenu}
              onPromote={onPromote}
              onDemote={onDemote}
              onRemove={onRemove}
            />
          );
        })}
      </div>
    </div>
  );
}
