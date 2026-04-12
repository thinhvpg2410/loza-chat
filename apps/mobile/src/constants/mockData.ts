export type ConversationKind = "direct" | "group";

export type MockConversation = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  avatarUrl: string;
  isPinned?: boolean;
  verified?: boolean;
  /** Muted conversation — preview muted styling + icon */
  isMuted?: boolean;
  /** Peer online (direct chat / last seen UX placeholder) */
  isOnline?: boolean;
  /** Group thread — list row + chat header use group UX */
  kind?: ConversationKind;
  /** Group only — shown on list row / header */
  memberCount?: number;
  /** Direct chat: other participant user id (real API) */
  directPeerId?: string;
};

export type MockFriend = {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
  subtitle?: string;
  /** @loza_username style */
  username?: string;
  phone?: string;
};

/** Incoming friend request — mock */
export type MockFriendRequest = {
  id: string;
  peer: MockFriend;
};

/** Outgoing friend request — mock */
export type MockOutgoingFriendRequest = {
  id: string;
  peer: MockFriend;
};

export type MockPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  timeLabel: string;
};

/** Tạm thời trống — trải nghiệm như tài khoản mới, chưa có hội thoại. */
export const MOCK_CONVERSATIONS: MockConversation[] = [];

export const MOCK_FRIENDS: MockFriend[] = [
  {
    id: "f1",
    name: "Minh Anh",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
    isOnline: true,
    subtitle: "Đang hoạt động",
    username: "minh.anh",
    phone: "+84 901 234 567",
  },
  {
    id: "f2",
    name: "Quốc Huy",
    avatarUrl: "https://i.pravatar.cc/150?img=2",
    isOnline: true,
    subtitle: "Đang nghe nhạc",
    username: "qhuy.dev",
    phone: "+84 902 111 222",
  },
  {
    id: "f3",
    name: "Thu Hà",
    avatarUrl: "https://i.pravatar.cc/150?img=3",
    isOnline: false,
    subtitle: "30 phút trước",
    username: "thuha",
    phone: "+84 903 333 444",
  },
  {
    id: "f4",
    name: "Đức Thắng",
    avatarUrl: "https://i.pravatar.cc/150?img=4",
    isOnline: false,
    subtitle: "Hôm qua",
    username: "ducthang",
    phone: "+84 904 555 666",
  },
  {
    id: "f5",
    name: "Lan Chi",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
    isOnline: true,
    username: "lan.chi",
    phone: "+84 905 777 888",
  },
  {
    id: "f6",
    name: "An Bình",
    avatarUrl: "https://i.pravatar.cc/150?img=6",
    isOnline: false,
    subtitle: "Đang bận",
    username: "an.binh",
    phone: "+84 906 000 001",
  },
  {
    id: "f7",
    name: "Bảo Ngọc",
    avatarUrl: "https://i.pravatar.cc/150?img=7",
    isOnline: true,
    username: "baongoc",
    phone: "+84 907 000 002",
  },
  {
    id: "f8",
    name: "Cường Lê",
    avatarUrl: "https://i.pravatar.cc/150?img=8",
    isOnline: false,
    subtitle: "2 giờ trước",
    username: "cuong.le",
    phone: "+84 908 000 003",
  },
  {
    id: "f9",
    name: "Hoàng Nam",
    avatarUrl: "https://i.pravatar.cc/150?img=9",
    isOnline: true,
    username: "hoangnam",
    phone: "+84 909 000 004",
  },
  {
    id: "f10",
    name: "Ngọc Trâm",
    avatarUrl: "https://i.pravatar.cc/150?img=10",
    isOnline: false,
    subtitle: "Vừa xong",
    username: "ngoctram",
    phone: "+84 910 000 005",
  },
];

/** Mock — lời mời đến */
export const MOCK_INCOMING_FRIEND_REQUESTS: MockFriendRequest[] = [
  {
    id: "req-in-1",
    peer: {
      id: "u-in-1",
      name: "Phương Linh",
      avatarUrl: "https://i.pravatar.cc/150?img=25",
      isOnline: true,
      subtitle: "3 bạn chung",
      username: "phuonglinh",
      phone: "+84 911 222 333",
    },
  },
  {
    id: "req-in-2",
    peer: {
      id: "u-in-2",
      name: "Trần Kiên",
      avatarUrl: "https://i.pravatar.cc/150?img=26",
      isOnline: false,
      username: "kientran",
      phone: "+84 912 444 555",
    },
  },
];

/** Mock — đã gửi lời mời */
export const MOCK_OUTGOING_FRIEND_REQUESTS: MockOutgoingFriendRequest[] = [
  {
    id: "req-out-1",
    peer: {
      id: "u-out-1",
      name: "Mai Phương",
      avatarUrl: "https://i.pravatar.cc/150?img=27",
      isOnline: false,
      subtitle: "Chờ phản hồi",
      username: "maiphuong",
      phone: "+84 913 666 777",
    },
  },
];

/** Users discoverable by search (not necessarily friends) — demo lookup */
export const MOCK_SEARCH_USERS: MockFriend[] = [
  {
    id: "u-search-1",
    name: "Văn Tài",
    avatarUrl: "https://i.pravatar.cc/150?img=30",
    isOnline: false,
    username: "vantai",
    phone: "+84 990 000 001",
  },
  {
    id: "u-search-2",
    name: "Lệ Hằng",
    avatarUrl: "https://i.pravatar.cc/150?img=31",
    isOnline: true,
    username: "lehang",
    phone: "+84 990 000 002",
  },
];

export const MOCK_POSTS: MockPost[] = [
  {
    id: "p1",
    authorId: "f1",
    authorName: "Minh Anh",
    authorAvatar: "https://i.pravatar.cc/150?img=1",
    content: "Cuối tuần chill ở Đà Lạt, không khí mát lạnh ☕",
    imageUrl: "https://picsum.photos/id/29/800/500",
    likes: 128,
    comments: 14,
    timeLabel: "2 giờ trước",
  },
  {
    id: "p2",
    authorId: "f3",
    authorName: "Thu Hà",
    authorAvatar: "https://i.pravatar.cc/150?img=3",
    content: "Mới hoàn thành sprint, team mình xuất sắc!",
    imageUrl: "https://picsum.photos/id/48/800/500",
    likes: 89,
    comments: 6,
    timeLabel: "Hôm qua",
  },
  {
    id: "p3",
    authorId: "f4",
    authorName: "Đức Thắng",
    authorAvatar: "https://i.pravatar.cc/150?img=4",
    content: "Share một tip React Native hữu ích cho mọi người.",
    likes: 256,
    comments: 42,
    timeLabel: "3 ngày trước",
  },
];

export const DISCOVER_FEATURES = [
  { id: "d1", title: "Mini App", subtitle: "Tiện ích", icon: "apps-outline" as const },
  { id: "d2", title: "Dịch vụ", subtitle: "Thanh toán & đặt chỗ", icon: "briefcase-outline" as const },
  { id: "d3", title: "Game", subtitle: "Giải trí", icon: "game-controller-outline" as const },
  { id: "d4", title: "Mua sắm", subtitle: "Ưu đãi", icon: "cart-outline" as const },
  { id: "d5", title: "Nhạc", subtitle: "Playlist", icon: "musical-notes-outline" as const },
  { id: "d6", title: "Video", subtitle: "Trending", icon: "play-circle-outline" as const },
];
