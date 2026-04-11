import type {
  Friend,
  FriendRequest,
  GroupMember,
  GroupSummary,
  ProfileUser,
  SearchableUser,
} from "@/lib/types/social";

export const mockFriends: Friend[] = [
  {
    id: "u-1",
    displayName: "Minh Anh",
    username: "minhanh",
    phone: "+84 90 123 4567",
    status: "Đang bận",
    isOnline: true,
    lastContactedAt: "2026-04-05T12:00:00.000Z",
  },
  {
    id: "u-2",
    displayName: "Quốc Huy",
    username: "quochuy",
    phone: "+84 90 765 4321",
    status: "Đang hoạt động",
    isOnline: true,
    lastContactedAt: "2026-04-04T09:30:00.000Z",
  },
  {
    id: "u-3",
    displayName: "Thảo Vy",
    username: "thaovy",
    phone: "+84 91 000 0000",
    status: "Không làm phiền",
    isOnline: false,
    lastContactedAt: "2026-03-28T10:00:00.000Z",
  },
  {
    id: "u-4",
    displayName: "Đức Thịnh",
    username: "ducthinh",
    avatarUrl: undefined,
    status: "Đang hoạt động",
    isOnline: false,
    lastContactedAt: "2026-04-05T08:00:00.000Z",
  },
  {
    id: "u-5",
    displayName: "Lan Chi",
    username: "lanchi",
    phone: "+84 93 222 2222",
    status: "Đang bận",
    isOnline: true,
    lastContactedAt: "2026-04-05T12:00:00.000Z",
  },
];

export const mockFriendRequests: FriendRequest[] = [
  {
    id: "fr-1",
    displayName: "Bảo Ngọc",
    username: "baongoc",
    phone: "+84 90 111 2222",
    message: "Hi, mình là bạn của Minh Anh",
    direction: "incoming",
    status: "pending",
  },
  {
    id: "fr-2",
    displayName: "Hùng Phát",
    username: "hungphat",
    direction: "incoming",
    status: "pending",
  },
  {
    id: "fr-3",
    displayName: "Kim Liên",
    username: "kimlien",
    message: "Kết bạn nhé!",
    direction: "outgoing",
    status: "pending",
  },
  {
    id: "fr-4",
    displayName: "Trọng Đức",
    username: "trongduc",
    direction: "outgoing",
    status: "pending",
  },
];

export const mockSearchableUsers: SearchableUser[] = [
  {
    id: "su-1",
    displayName: "Ngọc Trâm",
    username: "ngoctram",
    phone: "+84 90 999 8888",
    relation: "none",
  },
  {
    id: "su-2",
    displayName: "Minh Anh",
    username: "minhanh",
    phone: "+84 90 123 4567",
    relation: "friend",
  },
  {
    id: "su-3",
    displayName: "Tuấn Kiệt",
    username: "tuankiet",
    phone: "+84 90 123 0000",
    relation: "pending_out",
  },
  {
    id: "su-4",
    displayName: "Phương Anh",
    username: "phuonganh",
    phone: "+84 90 123 1111",
    relation: "pending_in",
  },
];

export const mockGroups: GroupSummary[] = [
  {
    id: "g-1",
    name: "Team Loza — Web",
    memberCount: 12,
    lastMessagePreview: "Thảo: mình push lên nhánh feature/web rồi nhé",
    lastMessageAt: "Hôm nay",
    muted: false,
  },
  {
    id: "g-2",
    name: "Gia đình",
    memberCount: 6,
    lastMessagePreview: "Mẹ: tối nay về ăn cơm",
    lastMessageAt: "Hôm qua",
    muted: true,
  },
  {
    id: "g-3",
    name: "Học nhóm Toán",
    memberCount: 24,
    lastMessagePreview: "Thầy: đề ôn đã gửi trong nhóm",
    lastMessageAt: "T2",
  },
];

export const mockGroupMembersByGroupId: Record<string, GroupMember[]> = {
  "g-1": [
    { id: "gm-1", userId: "me", displayName: "Bạn", username: "ban", role: "owner", online: true },
    { id: "gm-2", userId: "u-1", displayName: "Minh Anh", username: "minhanh", role: "admin", online: true },
    { id: "gm-3", userId: "u-2", displayName: "Quốc Huy", username: "quochuy", role: "member", online: false },
    { id: "gm-4", userId: "u-3", displayName: "Thảo Vy", username: "thaovy", role: "member", online: true },
    { id: "gm-5", userId: "u-4", displayName: "Đức Thịnh", username: "ducthinh", role: "member", online: false },
  ],
  "g-2": [
    { id: "gm-1", userId: "me", displayName: "Bạn", username: "ban", role: "member", online: true },
    { id: "gm-6", userId: "u-6", displayName: "Mẹ", username: "me", role: "owner", online: true },
  ],
  "g-3": [
    { id: "gm-1", userId: "me", displayName: "Bạn", username: "ban", role: "member", online: true },
    { id: "gm-7", userId: "u-7", displayName: "Thầy Nam", username: "thaynam", role: "admin", online: false },
  ],
};

export const mockSelfProfile: ProfileUser = {
  id: "me",
  displayName: "Nguyễn Văn A",
  username: "nguyenvana",
  phone: "+84 90 000 0000",
  bio: "Available on Loza Chat",
  mutualFriendsCount: 0,
  isSelf: true,
};

export function getProfileForFriend(friend: Friend): ProfileUser {
  return (
    getProfileById(friend.id) ?? {
      id: friend.id,
      displayName: friend.displayName,
      username: friend.username,
      phone: friend.phone,
      bio: friend.status,
      mutualFriendsCount: 0,
    }
  );
}

export function getProfileById(id: string): ProfileUser | null {
  if (id === mockSelfProfile.id) return mockSelfProfile;
  const map: Record<string, ProfileUser> = {
    "u-1": {
      id: "u-1",
      displayName: "Minh Anh",
      username: "minhanh",
      phone: "+84 90 123 4567",
      bio: "Designer • Hà Nội",
      mutualFriendsCount: 12,
    },
    "u-2": {
      id: "u-2",
      displayName: "Quốc Huy",
      username: "quochuy",
      phone: "+84 90 765 4321",
      bio: "Dev • TP.HCM",
      mutualFriendsCount: 8,
    },
    "u-3": {
      id: "u-3",
      displayName: "Thảo Vy",
      username: "thaovy",
      phone: "+84 91 000 0000",
      bio: "Product • Remote",
      mutualFriendsCount: 5,
    },
    "u-4": {
      id: "u-4",
      displayName: "Đức Thịnh",
      username: "ducthinh",
      phone: "+84 92 333 4444",
      bio: "Backend",
      mutualFriendsCount: 4,
    },
    "u-5": {
      id: "u-5",
      displayName: "Lan Chi",
      username: "lanchi",
      phone: "+84 93 222 2222",
      bio: "QA",
      mutualFriendsCount: 9,
    },
  };
  return map[id] ?? null;
}

export function mockSearchUsers(query: string): SearchableUser[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return mockSearchableUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.phone && u.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))),
  );
}

/** Pickable contacts for group creation (mock). */
export const mockSelectableMembersForGroup: Friend[] = mockFriends;
