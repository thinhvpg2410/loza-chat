"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconClose } from "@/components/chat/icons";
import { Avatar } from "@/components/common/Avatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AddMemberModal } from "@/components/groups/AddMemberModal";
import { GroupInfoPanel } from "@/components/groups/GroupInfoPanel";
import { GroupPermissionPanel } from "@/components/groups/GroupPermissionPanel";
import { JoinRequestList } from "@/components/groups/JoinRequestList";
import { TransferGroupOwnerModal } from "@/components/groups/TransferGroupOwnerModal";
import { getChatRealtimeSessionAction } from "@/features/chat/chat-actions";
import {
  addGroupMembersAction,
  approveGroupJoinRequestAction,
  approveGroupMemberAction,
  dissolveGroupAction,
  fetchGroupJoinQueueAction,
  leaveGroupAction,
  rejectGroupJoinRequestAction,
  rejectGroupMemberAction,
  removeGroupMemberAction,
  transferGroupOwnershipAction,
  updateGroupMemberRoleAction,
  updateGroupSettingsAction,
} from "@/features/chat/groups-actions";
import { fetchFriendsListAction } from "@/features/friends/friends-actions";
import type { ApiGroupDetail, ApiJoinQueueItem } from "@/lib/chat/api-dtos";
import { buildGroupPermissionFlags } from "@/lib/types/groups";
import type { Conversation } from "@/lib/types/chat";
import type { Friend, GroupMember, GroupMemberRole, GroupSummary } from "@/lib/types/social";

function conversationToGroupSummary(c: Conversation): GroupSummary {
  return {
    id: c.id,
    name: c.title,
    avatarUrl: c.avatarUrl,
    memberCount: c.memberCount ?? 0,
    lastMessagePreview: c.lastMessagePreview,
    lastMessageAt: c.lastMessageAt,
    muted: c.isMuted,
  };
}

function mapDetailToMembers(detail: ApiGroupDetail, viewerId: string | null): GroupMember[] {
  return detail.members.map((m) => ({
    id: m.userId,
    userId: m.userId,
    displayName: m.user.displayName,
    username: m.user.username ?? "",
    role: m.role as GroupMemberRole,
    avatarUrl: m.user.avatarUrl ?? undefined,
    isSelf: viewerId !== null && m.userId === viewerId,
  }));
}

export type GroupChatInfoDrawerProps = {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
  groupDetail: ApiGroupDetail | null;
  onGroupDetailChange: (detail: ApiGroupDetail | null) => void;
  /** Optional viewer id from realtime; drawer still resolves session when open. */
  viewerHintUserId?: string | null;
  reloadGroupDetail: () => Promise<void>;
  refreshConversationList: () => Promise<void>;
  onGroupConversationEnded?: (conversationId: string) => void;
};

export function GroupChatInfoDrawer({
  open,
  onClose,
  conversation,
  groupDetail,
  onGroupDetailChange,
  viewerHintUserId = null,
  reloadGroupDetail,
  refreshConversationList,
  onGroupConversationEnded,
}: GroupChatInfoDrawerProps) {
  const conversationId = conversation.id;

  const [viewerId, setViewerId] = useState<string | null>(viewerHintUserId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [joinQueue, setJoinQueue] = useState<ApiJoinQueueItem[]>([]);
  const [joinQueueLoading, setJoinQueueLoading] = useState(false);
  const [joinBusyUserId, setJoinBusyUserId] = useState<string | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState<{ id: string; name: string } | null>(null);
  const [dissolveOpen, setDissolveOpen] = useState(false);
  const [dissolveBusy, setDissolveBusy] = useState(false);
  const [leaveMemberOpen, setLeaveMemberOpen] = useState(false);
  const [leaveAloneDissolveOpen, setLeaveAloneDissolveOpen] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsErr, setSettingsErr] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);

  const permissions = useMemo(
    () => buildGroupPermissionFlags(groupDetail, viewerId),
    [groupDetail, viewerId],
  );
  const canModerateRef = useRef(permissions.canModerateMembers);
  useEffect(() => {
    canModerateRef.current = permissions.canModerateMembers;
  }, [permissions.canModerateMembers]);

  useEffect(() => {
    setViewerId(viewerHintUserId);
  }, [viewerHintUserId]);

  useEffect(() => {
    if (!open) return;
    void getChatRealtimeSessionAction().then((r) => {
      if (r.ok) setViewerId(r.viewerUserId);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void reloadGroupDetail();
  }, [open, conversationId, reloadGroupDetail]);

  useEffect(() => {
    if (!open || !addMemberOpen) return;
    void fetchFriendsListAction().then((r) => {
      if (!r.ok) return;
      setFriends(
        r.friends.map((f) => ({
          id: f.id,
          displayName: f.displayName,
          username: f.username ?? "",
          isOnline: false,
        })),
      );
    });
  }, [open, addMemberOpen]);

  const reloadJoinQueue = useCallback(async () => {
    if (!canModerateRef.current) {
      setJoinQueue([]);
      return;
    }
    const r = await fetchGroupJoinQueueAction(conversationId);
    if (r.ok) setJoinQueue(r.items);
  }, [conversationId]);

  useEffect(() => {
    if (!open || !permissions.canModerateMembers) {
      setJoinQueue([]);
      return;
    }
    let cancelled = false;
    setJoinQueueLoading(true);
    void fetchGroupJoinQueueAction(conversationId).then((r) => {
      if (cancelled) return;
      setJoinQueueLoading(false);
      if (r.ok) setJoinQueue(r.items);
      else setJoinQueue([]);
    });
    return () => {
      cancelled = true;
    };
  }, [open, conversationId, permissions.canModerateMembers, groupDetail?.conversationId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const groupSummary = useMemo(() => conversationToGroupSummary(conversation), [conversation]);
  const members = groupDetail ? mapDetailToMembers(groupDetail, viewerId) : [];

  const otherActiveMemberCount =
    groupDetail && viewerId
      ? groupDetail.members.filter((m) => m.status === "active" && m.userId !== viewerId).length
      : 0;

  const excludedIds = useMemo(() => {
    const s = new Set<string>();
    if (!groupDetail) return s;
    for (const m of groupDetail.members) s.add(m.userId);
    for (const m of groupDetail.pendingMembers ?? []) s.add(m.userId);
    for (const q of joinQueue) s.add(q.userId);
    return s;
  }, [groupDetail, joinQueue]);

  const nameByUserId = useMemo(() => {
    const m: Record<string, string> = {};
    if (!groupDetail) return m;
    for (const x of groupDetail.members) {
      m[x.userId] = x.user.displayName;
    }
    for (const x of groupDetail.pendingMembers ?? []) {
      m[x.userId] = x.user.displayName;
    }
    return m;
  }, [groupDetail]);

  const viewerRoleUi = groupDetail
    ? groupDetail.myRole === "owner"
      ? "owner"
      : groupDetail.myRole === "admin"
        ? "admin"
        : "member"
    : "member";

  const runAfterModeration = () => {
    void reloadGroupDetail();
    void reloadJoinQueue();
    void refreshConversationList();
  };

  const handleApproveQueue = (userId: string) => {
    if (!groupDetail) return;
    const item = joinQueue.find((x) => x.userId === userId);
    setJoinBusyUserId(userId);
    setActionError(null);
    const done = () => setJoinBusyUserId(null);
    if (!item) {
      done();
      return;
    }
    if (item.kind === "self_request") {
      void approveGroupJoinRequestAction(conversationId, userId).then((r) => {
        done();
        if (!r.ok) setActionError(r.error);
        else {
          onGroupDetailChange(r.group);
          runAfterModeration();
        }
      });
      return;
    }
    void approveGroupMemberAction(conversationId, userId).then((r) => {
      done();
      if (!r.ok) setActionError(r.error);
      else {
        onGroupDetailChange(r.group);
        runAfterModeration();
      }
    });
  };

  const handleRejectQueue = (userId: string) => {
    const item = joinQueue.find((x) => x.userId === userId);
    setJoinBusyUserId(userId);
    setActionError(null);
    const done = () => setJoinBusyUserId(null);
    if (!item) {
      done();
      return;
    }
    if (item.kind === "self_request") {
      void rejectGroupJoinRequestAction(conversationId, userId).then((r) => {
        done();
        if (!r.ok) setActionError(r.error);
        else void reloadJoinQueue();
      });
      return;
    }
    void rejectGroupMemberAction(conversationId, userId).then((r) => {
      done();
      if (!r.ok) setActionError(r.error);
      else {
        onGroupDetailChange(r.group);
        void reloadJoinQueue();
      }
    });
  };

  const performLeave = useCallback(() => {
    setLeaveBusy(true);
    setActionError(null);
    void leaveGroupAction(conversationId).then((r) => {
      setLeaveBusy(false);
      if (!r.ok) {
        setActionError(r.error);
        return;
      }
      setLeaveMemberOpen(false);
      onClose();
      onGroupConversationEnded?.(conversationId);
      void refreshConversationList();
    });
  }, [conversationId, onClose, onGroupConversationEnded, refreshConversationList]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex justify-end bg-black/35"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex h-full w-[min(100vw,380px)] max-w-full flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-chat-info-drawer-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--zalo-border)] bg-white px-2">
          <h2 id="group-chat-info-drawer-title" className="truncate pl-1 text-[14px] font-semibold text-[var(--zalo-text)]">
            Thông tin nhóm
          </h2>
          <button
            type="button"
            className="rounded-full p-2 text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06] hover:text-[var(--zalo-text)]"
            title="Đóng"
            onClick={onClose}
          >
            <IconClose className="h-5 w-5" />
            <span className="sr-only">Đóng</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {actionError ? (
            <div className="border-b border-red-100 bg-red-50 px-3 py-2" role="alert">
              <p className="text-center text-[12px] text-red-700">{actionError}</p>
            </div>
          ) : null}

          {groupDetail ? (
            <GroupInfoPanel
              group={groupSummary}
              members={members}
              onlyLeaderDeputyCanChat={groupDetail.settings.onlyAdminsCanPost}
              joinApprovalRequired={groupDetail.settings.joinApprovalRequired}
              viewerUserId={viewerId}
              viewerRole={viewerRoleUi}
              canRemoveOthers={permissions.canRemoveMembers}
              extraSections={
                <>
                  {permissions.canModerateMembers ? (
                    <div className="rounded-md border border-[var(--zalo-border)]/70 bg-[var(--zalo-surface)] px-2.5 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
                        Chờ duyệt
                      </p>
                      {joinQueueLoading ? (
                        <p className="py-2 text-[12px] text-[var(--zalo-text-muted)]">Đang tải…</p>
                      ) : (
                        <JoinRequestList
                          items={joinQueue}
                          nameByUserId={nameByUserId}
                          canModerate={permissions.canModerateMembers}
                          busyUserId={joinBusyUserId}
                          onApprove={handleApproveQueue}
                          onReject={handleRejectQueue}
                        />
                      )}
                    </div>
                  ) : null}
                  <GroupPermissionPanel
                    detail={groupDetail}
                    permissions={permissions}
                    busy={settingsBusy}
                    error={settingsErr}
                    onPatchSettings={(patch) => {
                      setSettingsBusy(true);
                      setSettingsErr(null);
                      void updateGroupSettingsAction(conversationId, patch).then((r) => {
                        setSettingsBusy(false);
                        if (!r.ok) setSettingsErr(r.error);
                        else onGroupDetailChange(r.group);
                      });
                    }}
                  />
                </>
              }
              onMuteToggle={() => {}}
              onSearchMessages={() => {}}
              onManageMembers={() => {}}
              onAddMember={
                permissions.canAddMembers
                  ? () => {
                      setActionError(null);
                      setAddMemberOpen(true);
                    }
                  : undefined
              }
              onLeave={() => {
                if (!groupDetail || !viewerId) return;
                setActionError(null);
                const isLeader = groupDetail.myRole === "owner";
                if (isLeader) {
                  if (otherActiveMemberCount === 0) {
                    setLeaveAloneDissolveOpen(true);
                    return;
                  }
                  setTransferOpen(true);
                  return;
                }
                setLeaveMemberOpen(true);
              }}
              onDissolve={
                permissions.canDissolve
                  ? () => {
                      setActionError(null);
                      setDissolveOpen(true);
                    }
                  : undefined
              }
              onPromoteMember={(memberId) => {
                setActionError(null);
                void updateGroupMemberRoleAction(conversationId, memberId, "admin").then((r) => {
                  if (!r.ok) setActionError(r.error);
                  else void reloadGroupDetail();
                });
              }}
              onDemoteMember={(memberId) => {
                setActionError(null);
                void updateGroupMemberRoleAction(conversationId, memberId, "member").then((r) => {
                  if (!r.ok) setActionError(r.error);
                  else void reloadGroupDetail();
                });
              }}
              onRemoveMember={(memberId) => {
                const m = members.find((x) => x.userId === memberId);
                setKickTarget({ id: memberId, name: m?.displayName ?? memberId });
              }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-[var(--zalo-chat-bg)] px-6 py-10">
              <Avatar name={conversation.title} size="md" src={conversation.avatarUrl} />
              <p className="max-w-full text-center text-[15px] font-semibold text-[var(--zalo-text)]">
                {conversation.title}
              </p>
              <p className="text-center text-[12px] text-[var(--zalo-text-muted)]">Đang tải chi tiết nhóm…</p>
            </div>
          )}
        </div>
      </div>

      <AddMemberModal
        open={addMemberOpen}
        friends={friends}
        excludedIds={excludedIds}
        onClose={() => setAddMemberOpen(false)}
        onSubmit={(ids) => {
          if (ids.length === 0) return;
          setActionError(null);
          void addGroupMembersAction(conversationId, ids).then((r) => {
            if (!r.ok) setActionError(r.error);
            else {
              setAddMemberOpen(false);
              onGroupDetailChange(r.group);
              void reloadJoinQueue();
              void refreshConversationList();
            }
          });
        }}
      />

      <TransferGroupOwnerModal
        open={transferOpen}
        members={members}
        currentUserId={viewerId ?? ""}
        onClose={() => setTransferOpen(false)}
        onConfirm={(newOwnerUserId) => {
          setActionError(null);
          void transferGroupOwnershipAction(conversationId, newOwnerUserId).then((r) => {
            if (!r.ok) {
              setActionError(r.error);
              return;
            }
            onGroupDetailChange(r.group);
            void leaveGroupAction(conversationId).then((lr) => {
              if (!lr.ok) {
                setActionError(lr.error);
                return;
              }
              setTransferOpen(false);
              onClose();
              onGroupConversationEnded?.(conversationId);
              void refreshConversationList();
            });
          });
        }}
      />

      <ConfirmDialog
        open={kickTarget !== null}
        title="Xóa thành viên?"
        description={kickTarget ? `${kickTarget.name} sẽ bị xóa khỏi nhóm.` : undefined}
        confirmLabel="Xóa"
        variant="danger"
        onClose={() => setKickTarget(null)}
        onConfirm={() => {
          if (!kickTarget) return;
          const id = kickTarget.id;
          void removeGroupMemberAction(conversationId, id).then((r) => {
            setKickTarget(null);
            if (!r.ok) setActionError(r.error);
            else {
              onGroupDetailChange(r.group);
              void reloadJoinQueue();
              void refreshConversationList();
            }
          });
        }}
      />

      <ConfirmDialog
        open={dissolveOpen}
        title="Giải tán nhóm?"
        description="Mọi thành viên sẽ không còn truy cập nhóm này."
        confirmLabel="Giải tán"
        variant="danger"
        busy={dissolveBusy}
        onClose={() => {
          if (dissolveBusy) return;
          setDissolveOpen(false);
        }}
        onConfirm={() => {
          setDissolveBusy(true);
          void dissolveGroupAction(conversationId).then((r) => {
            setDissolveBusy(false);
            if (!r.ok) {
              setActionError(r.error);
              return;
            }
            setDissolveOpen(false);
            onClose();
            onGroupConversationEnded?.(conversationId);
            void refreshConversationList();
          });
        }}
      />

      <ConfirmDialog
        open={leaveMemberOpen}
        title="Rời nhóm?"
        description="Bạn sẽ không nhận tin nhắn từ nhóm này nữa."
        confirmLabel="Rời nhóm"
        variant="danger"
        busy={leaveBusy}
        onClose={() => {
          if (leaveBusy) return;
          setLeaveMemberOpen(false);
        }}
        onConfirm={() => performLeave()}
      />

      <ConfirmDialog
        open={leaveAloneDissolveOpen}
        title="Bạn là thành viên cuối cùng"
        description="Giải tán nhóm để rời? Hoặc hủy và mời thêm thành viên trước khi chuyển quyền."
        confirmLabel="Giải tán & rời"
        variant="danger"
        busy={dissolveBusy}
        cancelLabel="Hủy"
        onClose={() => {
          if (dissolveBusy) return;
          setLeaveAloneDissolveOpen(false);
        }}
        onConfirm={() => {
          setDissolveBusy(true);
          void dissolveGroupAction(conversationId).then((r) => {
            setDissolveBusy(false);
            if (!r.ok) {
              setActionError(r.error);
              return;
            }
            setLeaveAloneDissolveOpen(false);
            onClose();
            onGroupConversationEnded?.(conversationId);
            void refreshConversationList();
          });
        }}
      />
    </div>
  );
}
