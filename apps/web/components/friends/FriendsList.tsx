"use client";

import type { Friend } from "@/lib/types/social";
import { EmptyState } from "@/components/common/EmptyState";
import { FriendRow } from "@/components/friends/FriendRow";

type FriendsListProps = {
  friends: Friend[];
  selectedId: string | null;
  onSelectFriend: (id: string) => void;
  onMessage?: (id: string) => void;
  searchEmpty?: boolean;
  filterEmpty?: boolean;
  listEmpty?: boolean;
};

export function FriendsList({
  friends,
  selectedId,
  onSelectFriend,
  onMessage,
  searchEmpty,
  filterEmpty,
  listEmpty,
}: FriendsListProps) {
  if (listEmpty) {
    return (
      <EmptyState
        title="Chưa có bạn bè"
        description="Thêm bạn bè để bắt đầu trò chuyện."
      />
    );
  }

  if (searchEmpty) {
    return (
      <EmptyState
        title="Không tìm thấy"
        description="Thử tìm theo tên hoặc số điện thoại."
      />
    );
  }

  if (filterEmpty) {
    return (
      <EmptyState
        title="Không có bạn bè phù hợp"
        description="Thử đổi bộ lọc hoặc tìm kiếm."
      />
    );
  }

  return (
    <div className="flex flex-col gap-px px-1 py-1">
      {friends.map((f) => (
        <FriendRow
          key={f.id}
          friend={f}
          isSelected={selectedId === f.id}
          onSelect={onSelectFriend}
          onMessage={onMessage}
        />
      ))}
    </div>
  );
}
