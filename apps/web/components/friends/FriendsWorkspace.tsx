"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconAdd } from "@/components/chat/icons";
import { SearchInput } from "@/components/common/SearchInput";
import { AddFriendModal } from "@/components/friends/AddFriendModal";
import { FriendsList } from "@/components/friends/FriendsList";
import { getProfileForFriend, mockFriends, mockSelfProfile } from "@/lib/mock-social";
import { UserProfileDrawer } from "@/components/profile/UserProfileDrawer";
import type { Friend, FriendListFilter } from "@/lib/types/social";

export function FriendsWorkspace() {
  const [filter, setFilter] = useState<FriendListFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [addFriendKey, setAddFriendKey] = useState(0);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list: Friend[] = mockFriends;

    if (q) {
      list = list.filter(
        (f) =>
          f.displayName.toLowerCase().includes(q) ||
          f.username.toLowerCase().includes(q) ||
          (f.phone && f.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))),
      );
    }

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
  }, [filter, searchQuery]);

  const profileFriend = profileUserId
    ? mockFriends.find((f) => f.id === profileUserId) ?? null
    : null;
  const profileUser = profileFriend ? getProfileForFriend(profileFriend) : null;

  const searchEmpty = searchQuery.trim().length > 0 && filtered.length === 0;
  const listEmpty = mockFriends.length === 0;
  const filterEmpty =
    !listEmpty &&
    searchQuery.trim().length === 0 &&
    filtered.length === 0;

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--zalo-chat-bg)]">
        <header className="shrink-0 border-b border-[var(--zalo-border)] bg-white px-3 pb-2.5 pt-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-[16px] font-semibold leading-tight text-[var(--zalo-text)]">Bạn bè</h1>
              <div className="mt-1 flex flex-wrap gap-2 text-[12px]">
                <Link
                  href="/friends/requests"
                  className="font-medium text-[var(--zalo-blue)] hover:underline"
                >
                  Lời mời kết bạn
                </Link>
                <span className="text-[var(--zalo-border)]">·</span>
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
          <div className="mt-2.5 flex gap-1">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="Tất cả" />
            <FilterChip active={filter === "online"} onClick={() => setFilter("online")} label="Trực tuyến" />
            <FilterChip
              active={filter === "recent"}
              onClick={() => setFilter("recent")}
              label="Liên hệ gần đây"
            />
          </div>
          <div className="mt-2">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bạn"
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--zalo-border)] bg-[var(--zalo-surface)]">
          <FriendsList
            friends={filtered}
            selectedId={selectedId}
            onSelectFriend={(id) => {
              setSelectedId(id);
              setProfileUserId(id);
            }}
            onMessage={() => {}}
            searchEmpty={searchEmpty}
            filterEmpty={filterEmpty}
            listEmpty={listEmpty}
          />
        </div>
      </div>

      <AddFriendModal
        key={addFriendKey}
        open={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
      />
      <UserProfileDrawer
        open={profileUserId !== null}
        user={profileUserId === "me" ? mockSelfProfile : profileUser}
        onClose={() => setProfileUserId(null)}
        onMessage={() => setProfileUserId(null)}
        onAddFriend={() => {}}
        onBlock={() => {}}
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
