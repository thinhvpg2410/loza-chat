"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconAdd } from "@/components/chat/icons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SearchInput } from "@/components/common/SearchInput";
import { AddFriendModal } from "@/components/friends/AddFriendModal";
import { FriendsList } from "@/components/friends/FriendsList";
import { openDirectChatWithUser } from "@/features/chat/open-direct-chat";
import {
  acceptIncomingForUserAction,
  blockUserAction,
  cancelOutgoingForUserAction,
  fetchFriendsListAction,
  fetchIncomingRequestsAction,
  getPublicProfileAction,
  rejectIncomingForUserAction,
  sendFriendRequestAction,
  unfriendAction,
  unblockUserAction,
} from "@/features/friends/friends-actions";
import { getProfileForFriend, mockFriends, mockSelfProfile } from "@/lib/mock-social";
import { mapApiFriend, mapPublicProfileToDrawerUser } from "@/lib/friends/map-api-social";
import { UserProfileDrawer } from "@/components/profile/UserProfileDrawer";
import type { Friend, FriendListFilter, ProfileUser } from "@/lib/types/social";

export type FriendsWorkspaceProps = {
  source?: "mock" | "api";
  initialFriends?: Friend[];
  initialError?: string | null;
  selfProfile?: ProfileUser | null;
  /** Incoming friend requests count (API); shown next to “Lời mời kết bạn”. */
  incomingRequestCount?: number;
};

type ConfirmState =
  | {
      kind: "unfriend" | "block";
      targetId: string;
      title: string;
      description: string;
      confirmLabel: string;
    }
  | null;

export function FriendsWorkspace({
  source = "mock",
  initialFriends = [],
  initialError = null,
  selfProfile = null,
  incomingRequestCount = 0,
}: FriendsWorkspaceProps) {
  const router = useRouter();
  const isApi = source === "api";

  const [friends, setFriends] = useState<Friend[]>(() => (isApi ? initialFriends : mockFriends));
  const [listError, setListError] = useState<string | null>(() =>
    isApi ? initialError : null,
  );

  useEffect(() => {
    if (!isApi) return;
    queueMicrotask(() => {
      setFriends(initialFriends);
      setListError(initialError);
    });
  }, [isApi, initialFriends, initialError]);

  const [filter, setFilter] = useState<FriendListFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [drawerUser, setDrawerUser] = useState<ProfileUser | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [addFriendKey, setAddFriendKey] = useState(0);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [openingDirectChatUserId, setOpeningDirectChatUserId] = useState<string | null>(null);
  const openingDirectChatLock = useRef(false);
  const [incomingBadgeCount, setIncomingBadgeCount] = useState(incomingRequestCount);

  const showOnlineRecentFilters = !isApi;

  useEffect(() => {
    setIncomingBadgeCount(incomingRequestCount);
  }, [incomingRequestCount]);

  const refreshFriends = useCallback(async () => {
    if (!isApi) return;
    const [rFriends, rInc] = await Promise.all([fetchFriendsListAction(), fetchIncomingRequestsAction()]);
    if (rFriends.ok) setFriends(rFriends.friends.map(mapApiFriend));
    if (rInc.ok) setIncomingBadgeCount(rInc.requests.length);
  }, [isApi]);

  useEffect(() => {
    if (!profileUserId || profileUserId === "me") {
      queueMicrotask(() => {
        setDrawerUser(null);
        setDrawerError(null);
        setDrawerLoading(false);
      });
      return;
    }
    if (!isApi) {
      queueMicrotask(() => {
        const f = mockFriends.find((x) => x.id === profileUserId) ?? null;
        setDrawerUser(f ? getProfileForFriend(f) : null);
        setDrawerError(null);
        setDrawerLoading(false);
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      setDrawerLoading(true);
      setDrawerError(null);
    });
    void getPublicProfileAction(profileUserId).then((r) => {
      if (cancelled) return;
      setDrawerLoading(false);
      if (!r.ok) {
        setDrawerError(r.error);
        setDrawerUser(null);
        return;
      }
      setDrawerUser(mapPublicProfileToDrawerUser(r.profile, r.relationshipStatus));
    });
    return () => {
      cancelled = true;
    };
  }, [profileUserId, isApi]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = friends;

    if (q) {
      list = list.filter(
        (f) =>
          f.displayName.toLowerCase().includes(q) ||
          f.username.toLowerCase().includes(q) ||
          (f.phone && f.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))),
      );
    }

    if (!showOnlineRecentFilters) return list;

    if (filter === "online") {
      list = list.filter((f) => f.isOnline);
    }

    if (filter === "recent") {
      list = [...list].sort((a, b) => {
        const ta = a.lastContactedAt ? Date.parse(a.lastContactedAt) : 0;
        const tb = b.lastContactedAt ? Date.parse(b.lastContactedAt) : 0;
        return tb - ta;
      });
    }

    return list;
  }, [filter, searchQuery, friends, showOnlineRecentFilters]);

  const profileUser: ProfileUser | null =
    profileUserId === "me"
      ? isApi && selfProfile
        ? selfProfile
        : mockSelfProfile
      : drawerUser;

  const searchEmpty = searchQuery.trim().length > 0 && filtered.length === 0;
  const listEmpty = friends.length === 0;
  const filterEmpty =
    showOnlineRecentFilters &&
    !listEmpty &&
    searchQuery.trim().length === 0 &&
    filtered.length === 0;

  const runOpenChat = useCallback(
    async (friendUserId: string, options?: { closeProfileOnSuccess?: boolean }) => {
      if (!isApi) {
        setToast("Đăng nhập qua API để nhắn tin.");
        return;
      }
      if (openingDirectChatLock.current) return;
      openingDirectChatLock.current = true;
      setOpeningDirectChatUserId(friendUserId);
      try {
        const r = await openDirectChatWithUser(friendUserId, router);
        if (!r.ok) {
          setToast(r.error);
          return;
        }
        if (options?.closeProfileOnSuccess) setProfileUserId(null);
      } finally {
        openingDirectChatLock.current = false;
        setOpeningDirectChatUserId(null);
      }
    },
    [isApi, router],
  );

  const handleUnfriend = async (otherUserId: string) => {
    setActionBusy(true);
    const r = await unfriendAction(otherUserId);
    setActionBusy(false);
    setConfirm(null);
    if (!r.ok) {
      setToast(r.error);
      return;
    }
    setToast("Đã hủy kết bạn.");
    setProfileUserId(null);
    await refreshFriends();
    router.refresh();
  };

  const handleBlock = async (blockedId: string) => {
    setActionBusy(true);
    const r = await blockUserAction(blockedId);
    setActionBusy(false);
    setConfirm(null);
    if (!r.ok) {
      setToast(r.error);
      return;
    }
    setToast("Đã chặn người dùng.");
    setProfileUserId(null);
    await refreshFriends();
    router.refresh();
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--zalo-chat-bg)]">
        <header className="shrink-0 border-b border-[var(--zalo-border)] bg-white px-3 pb-2.5 pt-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-[16px] font-semibold leading-tight text-[var(--zalo-text)]">Bạn bè</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                <Link
                  href="/friends/requests"
                  className="inline-flex items-center gap-1 font-medium text-[var(--zalo-blue)] hover:underline"
                >
                  Lời mời kết bạn
                  {isApi && incomingBadgeCount > 0 ? (
                    <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                      {incomingBadgeCount > 99 ? "99+" : incomingBadgeCount}
                    </span>
                  ) : null}
                </Link>
                <span className="text-[var(--zalo-border)]">·</span>
                {isApi ? (
                  <>
                    <Link
                      href="/friends/blocked"
                      className="font-medium text-[var(--zalo-blue)] hover:underline"
                    >
                      Đã chặn
                    </Link>
                    <span className="text-[var(--zalo-border)]">·</span>
                  </>
                ) : null}
                <button
                  type="button"
                  className="font-medium text-[var(--zalo-text-muted)] hover:text-[var(--zalo-text)]"
                  onClick={() => setProfileUserId("me")}
                >
                  Hồ sơ của tôi
                </button>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06] hover:text-[var(--zalo-text)]"
                title="Thêm bạn"
                onClick={() => {
                  setAddFriendKey((k) => k + 1);
                  setAddFriendOpen(true);
                }}
              >
                <IconAdd className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
          {showOnlineRecentFilters ? (
            <div className="mt-2.5 flex gap-1">
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="Tất cả" />
              <FilterChip
                active={filter === "online"}
                onClick={() => setFilter("online")}
                label="Trực tuyến"
              />
              <FilterChip
                active={filter === "recent"}
                onClick={() => setFilter("recent")}
                label="Liên hệ gần đây"
              />
            </div>
          ) : null}
          <div className="mt-2">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bạn"
            />
          </div>
        </header>

        {listError ? (
          <div
            className="shrink-0 border-b border-red-200 bg-red-50 px-3 py-2 text-center text-[12px] text-red-700"
            role="alert"
          >
            {listError}
          </div>
        ) : null}

        {toast ? (
          <div className="shrink-0 border-b border-[var(--zalo-border)] bg-[var(--zalo-surface)] px-3 py-1.5 text-center text-[12px] text-[var(--zalo-text)]">
            {toast}
            <button
              type="button"
              className="ml-2 text-[var(--zalo-blue)] underline"
              onClick={() => setToast(null)}
            >
              Đóng
            </button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--zalo-border)] bg-[var(--zalo-surface)]">
          <FriendsList
            friends={filtered}
            selectedId={selectedId}
            openingDirectChatUserId={openingDirectChatUserId}
            onSelectFriend={(id) => {
              setSelectedId(id);
              setProfileUserId(id);
            }}
            onMessage={(id) => void runOpenChat(id)}
            searchEmpty={searchEmpty}
            filterEmpty={filterEmpty}
            listEmpty={listEmpty}
            source={source}
            onUnfriend={
              isApi
                ? (id) =>
                    setConfirm({
                      kind: "unfriend",
                      targetId: id,
                      title: "Hủy kết bạn?",
                      description: "Bạn sẽ không còn thấy nhau trong danh sách bạn bè.",
                      confirmLabel: "Hủy kết bạn",
                    })
                : undefined
            }
            onBlock={
              isApi
                ? (id) =>
                    setConfirm({
                      kind: "block",
                      targetId: id,
                      title: "Chặn người này?",
                      description: "Họ sẽ bị xóa khỏi bạn bè và không thể nhắn tin cho bạn.",
                      confirmLabel: "Chặn",
                    })
                : undefined
            }
          />
        </div>
      </div>

      <AddFriendModal
        key={addFriendKey}
        open={addFriendOpen}
        source={source}
        onClose={() => setAddFriendOpen(false)}
        onFriendshipChanged={() => void refreshFriends()}
      />

      <UserProfileDrawer
        open={profileUserId !== null}
        user={profileUser}
        loading={isApi && profileUserId !== "me" && drawerLoading}
        error={isApi && profileUserId !== "me" ? drawerError : null}
        onClose={() => {
          setProfileUserId(null);
          setDrawerError(null);
        }}
        onMessage={() => {
          if (!profileUser || profileUser.isSelf) return;
          void runOpenChat(profileUser.id, { closeProfileOnSuccess: true });
        }}
        messageOpening={
          profileUser != null &&
          !profileUser.isSelf &&
          openingDirectChatUserId !== null &&
          openingDirectChatUserId === profileUser.id
        }
        onAddFriend={async () => {
          if (!profileUser || profileUser.isSelf) return;
          setActionBusy(true);
          const r = await sendFriendRequestAction(profileUser.id);
          setActionBusy(false);
          if (!r.ok) {
            setToast(r.error);
            return;
          }
          setToast("Đã gửi lời mời kết bạn.");
          void getPublicProfileAction(profileUser.id).then((res) => {
            if (res.ok) {
              setDrawerUser(mapPublicProfileToDrawerUser(res.profile, res.relationshipStatus));
            }
          });
          await refreshFriends();
          router.refresh();
        }}
        onBlock={() => {
          if (!profileUser || profileUser.isSelf) return;
          setConfirm({
            kind: "block",
            targetId: profileUser.id,
            title: "Chặn người này?",
            description: "Họ sẽ bị xóa khỏi bạn bè và không thể nhắn tin cho bạn.",
            confirmLabel: "Chặn",
          });
        }}
        onUnfriend={() => {
          if (!profileUser || profileUser.isSelf) return;
          setConfirm({
            kind: "unfriend",
            targetId: profileUser.id,
            title: "Hủy kết bạn?",
            description: "Bạn sẽ không còn thấy nhau trong danh sách bạn bè.",
            confirmLabel: "Hủy kết bạn",
          });
        }}
        onAcceptRequest={async () => {
          if (!profileUser || profileUser.isSelf) return;
          setActionBusy(true);
          const r = await acceptIncomingForUserAction(profileUser.id);
          setActionBusy(false);
          if (!r.ok) {
            setToast(r.error);
            return;
          }
          setToast("Đã chấp nhận lời mời.");
          void getPublicProfileAction(profileUser.id).then((res) => {
            if (res.ok) {
              setDrawerUser(mapPublicProfileToDrawerUser(res.profile, res.relationshipStatus));
            }
          });
          await refreshFriends();
          router.refresh();
        }}
        onRejectRequest={async () => {
          if (!profileUser || profileUser.isSelf) return;
          setActionBusy(true);
          const r = await rejectIncomingForUserAction(profileUser.id);
          setActionBusy(false);
          if (!r.ok) {
            setToast(r.error);
            return;
          }
          setToast("Đã từ chối lời mời.");
          setProfileUserId(null);
          router.refresh();
        }}
        onCancelOutgoing={async () => {
          if (!profileUser || profileUser.isSelf) return;
          setActionBusy(true);
          const r = await cancelOutgoingForUserAction(profileUser.id);
          setActionBusy(false);
          if (!r.ok) {
            setToast(r.error);
            return;
          }
          setToast("Đã thu hồi lời mời.");
          void getPublicProfileAction(profileUser.id).then((res) => {
            if (res.ok) {
              setDrawerUser(mapPublicProfileToDrawerUser(res.profile, res.relationshipStatus));
            }
          });
          router.refresh();
        }}
        onUnblock={async () => {
          if (!profileUser || profileUser.isSelf) return;
          setActionBusy(true);
          const r = await unblockUserAction(profileUser.id);
          setActionBusy(false);
          if (!r.ok) {
            setToast(r.error);
            return;
          }
          setToast("Đã bỏ chặn.");
          void getPublicProfileAction(profileUser.id).then((res) => {
            if (res.ok) {
              setDrawerUser(mapPublicProfileToDrawerUser(res.profile, res.relationshipStatus));
            }
          });
          router.refresh();
        }}
        actionBusy={actionBusy}
      />

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel ?? "OK"}
        variant={confirm?.kind === "block" ? "danger" : "default"}
        busy={actionBusy}
        onClose={() => !actionBusy && setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "unfriend") void handleUnfriend(confirm.targetId);
          if (confirm.kind === "block") void handleBlock(confirm.targetId);
        }}
      />
    </>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-[var(--zalo-blue)] shadow-sm ring-1 ring-black/[0.06]"
          : "rounded-md px-2.5 py-1 text-[12px] font-medium text-[var(--zalo-text-muted)] transition hover:text-[var(--zalo-text)]"
      }
    >
      {label}
    </button>
  );
}
