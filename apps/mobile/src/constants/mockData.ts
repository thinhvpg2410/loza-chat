export type MockConversation = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  avatarUrl: string;
  isPinned?: boolean;
  verified?: boolean;
};

export type MockFriend = {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
  subtitle?: string;
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

export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: "1",
    name: "Em 🫶",
    lastMessage: "Ok nhé anh, em gửi file sau",
    time: "22 giờ",
    unreadCount: 2,
    avatarUrl: "https://i.pravatar.cc/150?img=32",
    isPinned: true,
  },
  {
    id: "2",
    name: "My Documents",
    lastMessage: "Bạn đã nhận được tài liệu",
    time: "37 phút",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    verified: true,
  },
  {
    id: "3",
    name: "Nhóm 12 KTPM",
    lastMessage: "Lan: @Bạn có thể xem lịch thi...",
    time: "3 giờ",
    unreadCount: 1,
    avatarUrl: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: "4",
    name: "Zalo Official",
    lastMessage: "Cập nhật tính năng mới",
    time: "Hôm qua",
    avatarUrl: "https://i.pravatar.cc/150?img=60",
    verified: true,
  },
  {
    id: "5",
    name: "Anh Tuấn",
    lastMessage: "👍👍",
    time: "T2",
    avatarUrl: "https://i.pravatar.cc/150?img=15",
  },
  {
    id: "6",
    name: "Team Design",
    lastMessage: "Đã upload Figma",
    time: "CN",
    unreadCount: 5,
    avatarUrl: "https://i.pravatar.cc/150?img=45",
  },
];

export const MOCK_FRIENDS: MockFriend[] = [
  {
    id: "f1",
    name: "Minh Anh",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
    isOnline: true,
    subtitle: "Đang hoạt động",
  },
  {
    id: "f2",
    name: "Quốc Huy",
    avatarUrl: "https://i.pravatar.cc/150?img=2",
    isOnline: true,
    subtitle: "Đang nghe nhạc",
  },
  {
    id: "f3",
    name: "Thu Hà",
    avatarUrl: "https://i.pravatar.cc/150?img=3",
    isOnline: false,
    subtitle: "30 phút trước",
  },
  {
    id: "f4",
    name: "Đức Thắng",
    avatarUrl: "https://i.pravatar.cc/150?img=4",
    isOnline: false,
    subtitle: "Hôm qua",
  },
  {
    id: "f5",
    name: "Lan Chi",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
    isOnline: true,
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
