"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatRealtimeProvider, type GroupRoomEvent } from "@/components/chat/chat-realtime-context";
import { IconAdd } from "@/components/chat/icons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SearchInput } from "@/components/common/SearchInput";
import { AddMemberModal } from "@/components/groups/AddMemberModal";
import { CreateGroupModal, type CreateGroupPayload } from "@/components/groups/CreateGroupModal";
import { GroupInfoPanel } from "@/components/groups/GroupInfoPanel";
import { GroupListRow } from "@/components/groups/GroupListRow";
import { GroupPermissionPanel } from "@/components/groups/GroupPermissionPanel";
import { JoinRequestList } from "@/components/groups/JoinRequestList";
import { TransferGroupOwnerModal } from "@/components/groups/TransferGroupOwnerModal";
import { fetchConversationsListAction, getChatRealtimeSessionAction } from "@/features/chat/chat-actions";
import {
  addGroupMembersAction,
  approveGroupJoinRequestAction,
  approveGroupMemberAction,
  createGroupAction,
  dissolveGroupAction,
  fetchGroupDetailAction,
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

export function GroupsWorkspace() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const [detail, setDetail] = useState<ApiGroupDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createGroupKey, setCreateGroupKey] = useState(0);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createSubmitError, setCreateSubmitError] = useState<string | null>(null);

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

  const permissions = useMemo(() => buildGroupPermissionFlags(detail, viewerId), [detail, viewerId]);
  const canModerateRef = useRef(permissions.canModerateMembers);
  useEffect(() => {
    canModerateRef.current = permissions.canModerateMembers;
  }, [permissions.canModerateMembers]);

  const conversationIds = useMemo(() => groups.map((g) => g.id), [groups]);

  const refreshList = useCallback(async () => {
    const r = await fetchConversationsListAction("group");
    if (!r.ok) {
      setListError(r.error);
      return;
    }
    setListError(null);
    setGroups(r.conversations.map(conversationToGroupSummary));
  }, []);

  const reloadDetail = useCallback(async (conversationId: string) => {
    const r = await fetchGroupDetailAction(conversationId);
    if (r.ok) setDetail(r.group);
  }, []);

  const reloadJoinQueue = useCallback(async (conversationId: string) => {
    if (!canModerateRef.current) {
      setJoinQueue([]);
      return;
    }
    const r = await fetchGroupJoinQueueAction(conversationId);
    if (r.ok) setJoinQueue(r.items);
  }, []);

  const onGroupRoomEvent = useCallback(
    (ev: GroupRoomEvent) => {
      void refreshList();
      const sid = selectedIdRef.current;
      if (ev.type === "group_dissolved" && ev.conversationId === sid) {
        setSelectedId(null);
        setDetail(null);
        setJoinQueue([]);
        return;
      }
      if (ev.conversationId === sid && sid) {
        void reloadDetail(sid);
        void reloadJoinQueue(sid);
      }
    },
    [refreshList, reloadDetail, reloadJoinQueue],
  );

  useEffect(() => {
    void getChatRealtimeSessionAction().then((r) => {
      if (r.ok) setViewerId(r.viewerUserId);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    void refreshList().finally(() => {
      if (!cancelled) setListLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshList]);

  useEffect(() => {
    if (!createOpen && !addMemberOpen) return;
    void fetchFriendsListAction().then((r) => {
      if (!r.ok) return;
      const mapped: Friend[] = r.friends.map((f) => ({
        id: f.id,
        displayName: f.displayName,
        username: f.username ?? "",
        isOnline: false,
      }));
      setFriends(mapped);
    });
  }, [createOpen, addMemberOpen]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setJoinQueue([]);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void fetchGroupDetailAction(selectedId).then((r) => {
      if (cancelled) return;
      setDetailLoading(false);
      if (r.ok) setDetail(r.group);
      else {
        setDetail(null);
        setActionError(r.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !permissions.canModerateMembers) {
      setJoinQueue([]);
      return;
    }
    let cancelled = false;
    setJoinQueueLoading(true);
    void fetchGroupJoinQueueAction(selectedId).then((r) => {
      if (cancelled) return;
      setJoinQueueLoading(false);
      if (r.ok) setJoinQueue(r.items);
      else setJoinQueue([]);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, permissions.canModerateMembers, detail?.conversationId]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  const selected = selectedId ? (groups.find((g) => g.id === selectedId) ?? null) : null;
  const members = detail ? mapDetailToMembers(detail, viewerId) : [];

  /** Thành viên active khác viewer (pending nằm ở `pendingMembers`, không dùng cho chuyển quyền). */
  const otherActiveMemberCount =
    detail && viewerId
      ? detail.members.filter((m) => m.status === "active" && m.userId !== viewerId).length
      : 0;

  const excludedIds = useMemo(() => {
    const s = new Set<string>();
    if (!detail) return s;
    for (const m of detail.members) s.add(m.userId);
    for (const m of detail.pendingMembers ?? []) s.add(m.userId);
    for (const q of joinQueue) s.add(q.userId);
    return s;
  }, [detail, joinQueue]);

  const nameByUserId = useMemo(() => {
    const m: Record<string, string> = {};
    if (!detail) return m;
    for (const x of detail.members) {
      m[x.userId] = x.user.displayName;
    }
    for (const x of detail.pendingMembers ?? []) {
      m[x.userId] = x.user.displayName;
    }
    return m;
  }, [detail]);

  const viewerRoleUi = detail
    ? (detail.myRole === "owner" ? "owner" : detail.myRole === "admin" ? "admin" : "member")
    : "member";

  const runAfterModeration = () => {
    if (!selectedId) return;
    void reloadDetail(selectedId);
    void reloadJoinQueue(selectedId);
    void refreshList();
  };

  const handleApproveQueue = (userId: string) => {
    if (!selectedId || !detail) return;
    const item = joinQueue.find((x) => x.userId === userId);
    setJoinBusyUserId(userId);
    setActionError(null);
    const done = () => setJoinBusyUserId(null);
    if (!item) {
      done();
      return;
    }
    if (item.kind === "self_request") {
      void approveGroupJoinRequestAction(selectedId, userId).then((r) => {
        done();
        if (!r.ok) setActionError(r.error);
        else {
          setDetail(r.group);
          runAfterModeration();
        }
      });
      return;
    }
    void approveGroupMemberAction(selectedId, userId).then((r) => {
      done();
      if (!r.ok) setActionError(r.error);
      else {
        setDetail(r.group);
        runAfterModeration();
      }
    });
  };

  const handleRejectQueue = (userId: string) => {
    if (!selectedId) return;
    const item = joinQueue.find((x) => x.userId === userId);
    setJoinBusyUserId(userId);
    setActionError(null);
    const done = () => setJoinBusyUserId(null);
    if (!item) {
      done();
      return;
    }
    if (item.kind === "self_request") {
      void rejectGroupJoinRequestAction(selectedId, userId).then((r) => {
        done();
        if (!r.ok) setActionError(r.error);
        else void reloadJoinQueue(selectedId);
      });
      return;
    }
    void rejectGroupMemberAction(selectedId, userId).then((r) => {
      done();
      if (!r.ok) setActionError(r.error);
      else {
        setDetail(r.group);
        void reloadJoinQueue(selectedId);
      }
    });
  };

  const performLeave = useCallback(() => {
    if (!selectedId) return;
    setLeaveBusy(true);
    setActionError(null);
    void leaveGroupAction(selectedId).then((r) => {
      setLeaveBusy(false);
      if (!r.ok) {
        setActionError(r.error);
        return;
      }
      setLeaveMemberOpen(false);
      setSelectedId(null);
      setDetail(null);
      setJoinQueue([]);
      void refreshList();
    });
  }, [selectedId, refreshList]);

  const inner = (
    <>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <section
          className="flex w-[min(100%,var(--zalo-conversation-width))] min-w-[280px] max-w-[360px] shrink-0 flex-col border-r border-[var(--zalo-border)] bg-[var(--zalo-surface)]"
          aria-label="Danh sách nhóm"
        >
          <header className="shrink-0 border-b border-[var(--zalo-border)] bg-white px-2.5 pb-2 pt-2.5">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="text-[15px] font-semibold text-[var(--zalo-text)]">Nhóm</h1>
                <p className="text-[11px] text-[var(--zalo-text-muted)]">Nhóm chat của bạn</p>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06] hover:text-[var(--zalo-text)]"
                title="Tạo nhóm"
                onClick={() => {
                  setCreateGroupKey((k) => k + 1);
                  setCreateSubmitError(null);
                  setCreateOpen(true);
                }}
              >
                <IconAdd className="h-[18px] w-[18px]" />
              </button>
            </div>
            <div className="mt-2">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhóm"
              />
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">
            {listError ? (
              <p className="px-2 py-10 text-center text-[13px] text-red-600">{listError}</p>
            ) : listLoading ? (
              <p className="px-2 py-10 text-center text-[13px] text-[var(--zalo-text-muted)]">Đang tải…</p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-10 text-center text-[13px] text-[var(--zalo-text-muted)]">
                Chưa có nhóm. Tạo nhóm mới để bắt đầu.
              </p>
            ) : (
              <div className="flex flex-col gap-px">
                {filtered.map((g) => (
                  <GroupListRow
                    key={g.id}
                    group={g}
                    isActive={selectedId === g.id}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          className="flex min-w-0 flex-1 flex-col bg-[var(--zalo-chat-bg)]"
          aria-label="Nội dung nhóm"
        >
          {selected ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
              <p className="max-w-md text-center text-[14px] font-semibold text-[var(--zalo-text)]">
                {selected.name}
              </p>
              <p className="mt-2 max-w-md text-center text-[13px] text-[var(--zalo-text-muted)]">
                Mở cuộc trò chuyện để nhắn tin. Bạn có thể xem và quản lý thành viên ở cột bên phải.
              </p>
              <button
                type="button"
                className="mt-4 rounded-full bg-[var(--zalo-blue)] px-4 py-2 text-[13px] font-medium text-white"
                onClick={() => router.push(`/?open=${encodeURIComponent(selected.id)}`)}
              >
                Mở chat nhóm
              </button>
              {detailLoading ? (
                <p className="mt-3 text-[12px] text-[var(--zalo-text-muted)]">Đang tải chi tiết…</p>
              ) : null}
              {actionError ? (
                <p className="mt-3 max-w-md text-center text-[12px] text-red-600">{actionError}</p>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
              <p className="text-center text-[13px] text-[var(--zalo-text-muted)]">
                Chọn một nhóm để xem thông tin.
              </p>
            </div>
          )}
        </section>

        {selected && detail ? (
          <GroupInfoPanel
            group={selected}
            members={members}
            onlyLeaderDeputyCanChat={detail.settings.onlyAdminsCanPost}
            joinApprovalRequired={detail.settings.joinApprovalRequired}
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
                {detail ? (
                  <GroupPermissionPanel
                    detail={detail}
                    permissions={permissions}
                    busy={settingsBusy}
                    error={settingsErr}
                    onPatchSettings={(patch) => {
                      if (!selectedId) return;
                      setSettingsBusy(true);
                      setSettingsErr(null);
                      void updateGroupSettingsAction(selectedId, patch).then((r) => {
                        setSettingsBusy(false);
                        if (!r.ok) setSettingsErr(r.error);
                        else setDetail(r.group);
                      });
                    }}
                  />
                ) : null}
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
              if (!selectedId || !detail || !viewerId) return;
              setActionError(null);
              const isLeader = detail.myRole === "owner";
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
              if (!selectedId) return;
              setActionError(null);
              void updateGroupMemberRoleAction(selectedId, memberId, "admin").then((r) => {
                if (!r.ok) setActionError(r.error);
                else void reloadDetail(selectedId);
              });
            }}
            onDemoteMember={(memberId) => {
              if (!selectedId) return;
              setActionError(null);
              void updateGroupMemberRoleAction(selectedId, memberId, "member").then((r) => {
                if (!r.ok) setActionError(r.error);
                else void reloadDetail(selectedId);
              });
            }}
            onRemoveMember={(memberId) => {
              const m = members.find((x) => x.userId === memberId);
              setKickTarget({ id: memberId, name: m?.displayName ?? memberId });
            }}
          />
        ) : null}
      </div>

      <CreateGroupModal
        key={createGroupKey}
        open={createOpen}
        selectableMembers={friends}
        isSubmitting={createSubmitting}
        submitError={createSubmitError}
        onClose={() => {
          if (createSubmitting) return;
          setCreateOpen(false);
        }}
        onCreate={async (payload: CreateGroupPayload) => {
          setCreateSubmitError(null);
          setCreateSubmitting(true);
          const r = await createGroupAction({
            title: payload.name,
            memberIds: payload.memberIds,
            ...(payload.avatarUrl ? { avatarUrl: payload.avatarUrl } : {}),
          });
          setCreateSubmitting(false);
          if (!r.ok) {
            setCreateSubmitError(r.error);
            return;
          }
          setCreateOpen(false);
          void refreshList();
          router.push(`/?open=${encodeURIComponent(r.group.conversationId)}`);
        }}
      />

      <AddMemberModal
        open={addMemberOpen}
        friends={friends}
        excludedIds={excludedIds}
        onClose={() => setAddMemberOpen(false)}
        onSubmit={(ids) => {
          if (!selectedId || ids.length === 0) return;
          setActionError(null);
          void addGroupMembersAction(selectedId, ids).then((r) => {
            if (!r.ok) setActionError(r.error);
            else {
              setAddMemberOpen(false);
              setDetail(r.group);
              void reloadJoinQueue(selectedId);
              void refreshList();
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
          if (!selectedId) return;
          setActionError(null);
          void transferGroupOwnershipAction(selectedId, newOwnerUserId).then((r) => {
            if (!r.ok) {
              setActionError(r.error);
              return;
            }
            setDetail(r.group);
            void leaveGroupAction(selectedId).then((lr) => {
              if (!lr.ok) {
                setActionError(lr.error);
                return;
              }
              setTransferOpen(false);
              setSelectedId(null);
              setDetail(null);
              setJoinQueue([]);
              void refreshList();
            });
          });
        }}
      />

      <ConfirmDialog
        open={kickTarget !== null}
        title="Xóa thành viên?"
        description={
          kickTarget
            ? `${kickTarget.name} sẽ bị xóa khỏi nhóm.`
            : undefined
        }
        confirmLabel="Xóa"
        variant="danger"
        onClose={() => setKickTarget(null)}
        onConfirm={() => {
          if (!kickTarget || !selectedId) return;
          const id = kickTarget.id;
          void removeGroupMemberAction(selectedId, id).then((r) => {
            setKickTarget(null);
            if (!r.ok) setActionError(r.error);
            else {
              setDetail(r.group);
              void reloadJoinQueue(selectedId);
              void refreshList();
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
          if (!selectedId) return;
          setDissolveBusy(true);
          void dissolveGroupAction(selectedId).then((r) => {
            setDissolveBusy(false);
            if (!r.ok) {
              setActionError(r.error);
              return;
            }
            setDissolveOpen(false);
            setSelectedId(null);
            setDetail(null);
            setJoinQueue([]);
            void refreshList();
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
          if (!selectedId) return;
          setDissolveBusy(true);
          void dissolveGroupAction(selectedId).then((r) => {
            setDissolveBusy(false);
            if (!r.ok) {
              setActionError(r.error);
              return;
            }
            setLeaveAloneDissolveOpen(false);
            setSelectedId(null);
            setDetail(null);
            setJoinQueue([]);
            void refreshList();
          });
        }}
      />
    </>
  );

  return (
    <ChatRealtimeProvider
      conversationIds={conversationIds}
      activeConversationId={selectedId}
      onGroupRoomEvent={onGroupRoomEvent}
    >
      {inner}
    </ChatRealtimeProvider>
  );
}
