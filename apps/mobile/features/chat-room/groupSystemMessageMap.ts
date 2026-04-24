import type { ApiMessageWithReceipt } from "@/services/conversations/conversationsApi";

export type GroupSystemEventCopy = {
  badge: string;
  detail: string;
};

function readMetadata(m: ApiMessageWithReceipt): Record<string, unknown> | null {
  const raw = m.metadataJson;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

function actorLabel(m: ApiMessageWithReceipt): string {
  return m.sender.displayName?.trim() || "Thành viên";
}

function tailAfter(haystack: string, needle: string): string | null {
  const i = haystack.toLowerCase().indexOf(needle.toLowerCase());
  if (i < 0) return null;
  const t = haystack.slice(i + needle.length).trim();
  return t.length ? t : null;
}

function vnMembersAdded(actor: string, content: string | null): string {
  const tail = tailAfter(content ?? "", " added ");
  if (tail) return `${actor} đã thêm ${tail}`;
  return `${actor} đã thêm thành viên`;
}

function vnMemberRemoved(actor: string, content: string | null): string {
  const tail = tailAfter(content ?? "", " removed ");
  if (tail) return `${actor} đã xóa ${tail}`;
  return `${actor} đã xóa thành viên`;
}

function vnApprovedJoin(actor: string, content: string | null): string {
  const c = content ?? "";
  const tail = tailAfter(c, " approved ");
  if (!tail) return `${actor} đã duyệt tham gia`;
  const low = tail.toLowerCase();
  const j = low.indexOf(" to join");
  const name = j >= 0 ? tail.slice(0, j).trim() : tail.trim();
  return name ? `${actor} đã duyệt ${name}` : `${actor} đã duyệt tham gia`;
}

function vnOwnershipTransfer(content: string | null): string {
  const tail = tailAfter(content ?? "", "transferred ownership to ");
  if (tail) return `Quyền trưởng nhóm → ${tail}`;
  return "Đã chuyển quyền trưởng nhóm";
}

function vnMemberLeft(actor: string, content: string | null): string {
  if ((content ?? "").toLowerCase().includes("left the group")) {
    return `${actor} đã rời nhóm`;
  }
  return content?.trim() || `${actor} đã rời nhóm`;
}

function vnTitleChanged(actor: string, content: string | null, meta: Record<string, unknown>): string {
  const newTitle = typeof meta.newTitle === "string" ? meta.newTitle : null;
  if (newTitle) return `${actor}: «${newTitle}»`;
  const c = content ?? "";
  const quoted = c.match(/to "([^"]+)"/);
  if (quoted?.[1]) return `${actor}: «${quoted[1]}»`;
  return c || actor;
}

function vnGroupCreated(meta: Record<string, unknown>, content: string | null): string {
  const title = typeof meta.title === "string" ? meta.title.trim() : "";
  const added = Array.isArray(meta.addedUserIds) ? meta.addedUserIds.length : 0;
  if (title) {
    if (added > 0) return `${title} · ${added} thành viên ban đầu`;
    return title;
  }
  const c = content ?? "";
  const m = c.match(/group "([^"]+)"/i);
  if (m?.[1]) return m[1];
  return c.trim() || "Nhóm mới";
}

/**
 * Maps persisted group `system` messages (see API `groups.service` metadata.kind) to centered chat badges.
 */
export function mapGroupSystemMessageToEvent(m: ApiMessageWithReceipt): GroupSystemEventCopy | null {
  if (m.type !== "system") return null;
  const meta = readMetadata(m);
  const kind = typeof meta?.kind === "string" ? meta.kind : null;
  if (!kind) return null;

  const actor = actorLabel(m);
  const content = m.content;

  switch (kind) {
    case "group_created":
      return { badge: "Tạo nhóm", detail: vnGroupCreated(meta ?? {}, content) };
    case "members_added":
      return { badge: "Thêm thành viên", detail: vnMembersAdded(actor, content) };
    case "member_removed":
      return { badge: "Xóa khỏi nhóm", detail: vnMemberRemoved(actor, content) };
    case "member_approved":
      return { badge: "Đã duyệt", detail: vnApprovedJoin(actor, content) };
    case "member_left":
      return { badge: "Rời nhóm", detail: vnMemberLeft(actor, content) };
    case "ownership_transferred":
      return { badge: "Chuyển trưởng nhóm", detail: vnOwnershipTransfer(content) };
    case "title_changed":
      return { badge: "Đổi tên nhóm", detail: vnTitleChanged(actor, content, meta ?? {}) };
    case "avatar_updated":
      return { badge: "Đổi ảnh nhóm", detail: `${actor} đã cập nhật ảnh nhóm` };
    default:
      return null;
  }
}
