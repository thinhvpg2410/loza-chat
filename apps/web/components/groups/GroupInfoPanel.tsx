"use client";

import type { ReactNode } from "react";
import type { GroupMember, GroupSummary } from "@/lib/types/social";
import { Avatar } from "@/components/common/Avatar";
import { GroupMemberList } from "@/components/groups/GroupMemberList";

type GroupInfoPanelProps = {
  group: GroupSummary;
  members: GroupMember[];
  /** Trạng thái quyền nhóm (hiển thị badge). */
  onlyLeaderDeputyCanChat?: boolean;
  joinApprovalRequired?: boolean;
  /** Nội dung thêm dưới danh sách TV (join queue, cấu hình quyền, …). */
  extraSections?: ReactNode;
  viewerUserId?: string | null;
  viewerRole?: "owner" | "admin" | "member";
  canRemoveOthers?: boolean;
  onMuteToggle?: () => void;
  onSearchMessages?: () => void;
  onManageMembers?: () => void;
  onAddMember?: () => void;
  onLeave?: () => void;
  onDissolve?: () => void;
  onPromoteMember?: (memberId: string) => void;
  onDemoteMember?: (memberId: string) => void;
  onRemoveMember?: (memberId: string) => void;
  /** Trưởng/phó đổi tên và ảnh nhóm (theo API). */
  canEditGroupName?: boolean;
  canEditGroupAvatar?: boolean;
  onEditGroupProfile?: () => void;
};

const actionBtn =
  "h-7 min-w-0 flex-1 rounded-md border border-[var(--zalo-border)]/90 bg-white px-2 text-[11px] font-medium text-[var(--zalo-text)] shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:bg-[var(--zalo-surface)] active:bg-[var(--zalo-surface)]";

export function GroupInfoPanel({
  group,
  members,
  onlyLeaderDeputyCanChat,
  joinApprovalRequired,
  extraSections,
  viewerUserId = null,
  viewerRole = "member",
  canRemoveOthers = false,
  onMuteToggle,
  onSearchMessages,
  onManageMembers,
  onAddMember,
  onLeave,
  onDissolve,
  onPromoteMember,
  onDemoteMember,
  onRemoveMember,
  canEditGroupName = false,
  canEditGroupAvatar = false,
  onEditGroupProfile,
}: GroupInfoPanelProps) {
  const showEditProfile =
    Boolean(onEditGroupProfile) && (canEditGroupName || canEditGroupAvatar);
  return (
    <aside
      className="flex h-full w-full min-w-[280px] max-w-[340px] shrink-0 flex-col border-l border-[var(--zalo-border)] bg-white"
      aria-label="Thông tin nhóm"
    >
      <div className="shrink-0 border-b border-[var(--zalo-border)] bg-white px-3 pb-2.5 pt-3">
        <div className="flex flex-col items-center text-center">
          <Avatar name={group.name} size="md" src={group.avatarUrl} />
          <h2 className="mt-2 max-w-full px-1 text-[15px] font-semibold leading-snug text-[var(--zalo-text)]">
            {group.name}
          </h2>
          <p className="mt-0.5 text-[11px] font-medium tabular-nums leading-none text-[var(--zalo-text-subtle)]">
            {group.memberCount} thành viên
          </p>
          {showEditProfile ? (
            <button
              type="button"
              className="mt-2 text-[12px] font-semibold text-[var(--zalo-blue)] transition hover:underline"
              onClick={onEditGroupProfile}
            >
              {canEditGroupAvatar ? "Đổi tên hoặc ảnh nhóm" : "Đổi tên nhóm"}
            </button>
          ) : null}
          {onlyLeaderDeputyCanChat !== undefined || joinApprovalRequired !== undefined ? (
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {onlyLeaderDeputyCanChat ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-900 ring-1 ring-amber-200/80">
                  Hạn chế gửi tin
                </span>
              ) : null}
              {joinApprovalRequired ? (
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-900 ring-1 ring-sky-200/80">
                  Duyệt vào nhóm
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <button type="button" className={actionBtn} onClick={onMuteToggle}>
            {group.muted ? "Bật thông báo" : "Tắt thông báo"}
          </button>
          <button type="button" className={actionBtn} onClick={onSearchMessages}>
            Tìm tin nhắn
          </button>
          <button
            type="button"
            className={`${actionBtn} w-full flex-[1_1_100%] basis-full`}
            onClick={onManageMembers}
          >
            Quản lý thành viên
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--zalo-chat-bg)] px-2 py-2">
        <div className="rounded-md border border-[var(--zalo-border)]/80 bg-white px-1.5 py-1.5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          <GroupMemberList
            members={members}
            viewerUserId={viewerUserId}
            viewerRole={viewerRole}
            canRemoveOthers={canRemoveOthers}
            onAddMember={onAddMember}
            onPromote={onPromoteMember}
            onDemote={onDemoteMember}
            onRemove={onRemoveMember}
          />
        </div>
        {extraSections ? <div className="mt-2 space-y-2">{extraSections}</div> : null}
        <section className="mt-2.5 border-t border-[var(--zalo-border)]/80 pt-2.5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
            Ảnh / video / file
          </h3>
          <p className="mt-1 text-[12px] leading-snug text-[var(--zalo-text-muted)]">Liên kết nhanh</p>
        </section>
      </div>
      <div className="shrink-0 space-y-1.5 border-t border-[var(--zalo-border)] bg-white px-2.5 py-2">
        {onDissolve ? (
          <button
            type="button"
            className="h-8 w-full rounded-md border border-red-300/90 bg-white text-[12px] font-medium text-red-700 transition hover:bg-red-50/90"
            onClick={onDissolve}
          >
            Giải tán nhóm
          </button>
        ) : null}
        <button
          type="button"
          className="h-8 w-full rounded-md border border-red-200/90 bg-white text-[12px] font-medium text-red-600/95 transition hover:bg-red-50/90"
          onClick={onLeave}
        >
          Rời nhóm
        </button>
      </div>
    </aside>
  );
}
