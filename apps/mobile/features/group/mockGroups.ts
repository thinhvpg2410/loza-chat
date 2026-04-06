import type { GroupDetail, GroupMember } from "./types";

const m = (
  id: string,
  name: string,
  avatarUrl: string,
  role: GroupMember["role"],
): GroupMember => ({ id, name, avatarUrl, role });

/**
 * Rich member lists for group info — replace with API.
 */
export const MOCK_GROUP_DETAILS: Record<string, GroupDetail> = {
  "3": {
    conversationId: "3",
    name: "Nhóm 12 KTPM",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
    memberCount: 24,
    members: [
      m("f1", "Minh Anh", "https://i.pravatar.cc/150?img=1", "owner"),
      m("f2", "Quốc Huy", "https://i.pravatar.cc/150?img=2", "admin"),
      m("f3", "Thu Hà", "https://i.pravatar.cc/150?img=3", "admin"),
      m("f4", "Đức Thắng", "https://i.pravatar.cc/150?img=4", "member"),
      m("f5", "Lan Chi", "https://i.pravatar.cc/150?img=5", "member"),
      m("f6", "An Bình", "https://i.pravatar.cc/150?img=6", "member"),
    ],
  },
  "6": {
    conversationId: "6",
    name: "Team Design",
    avatarUrl: "https://i.pravatar.cc/150?img=45",
    memberCount: 8,
    members: [
      m("f7", "Bảo Ngọc", "https://i.pravatar.cc/150?img=7", "owner"),
      m("f1", "Minh Anh", "https://i.pravatar.cc/150?img=1", "member"),
      m("f8", "Cường Lê", "https://i.pravatar.cc/150?img=8", "member"),
      m("f9", "Hoàng Nam", "https://i.pravatar.cc/150?img=9", "member"),
    ],
  },
  "8": {
    conversationId: "8",
    name: "Nhóm Gia đình",
    avatarUrl: "https://i.pravatar.cc/150?img=20",
    memberCount: 6,
    members: [
      m("f10", "Ngọc Trâm", "https://i.pravatar.cc/150?img=10", "owner"),
      m("f3", "Thu Hà", "https://i.pravatar.cc/150?img=3", "member"),
      m("f4", "Đức Thắng", "https://i.pravatar.cc/150?img=4", "member"),
    ],
  },
};

export function getGroupDetail(conversationId: string): GroupDetail | undefined {
  return MOCK_GROUP_DETAILS[conversationId];
}
