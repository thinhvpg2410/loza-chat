import type { ApiMessageWithReceipt } from "@/lib/chat/api-dtos";

export function listPreviewFromApiMessage(row: ApiMessageWithReceipt): string {
  if (row.deletedAt) {
    return row.deletionMode === "recalled" ? "Tin nhắn đã được thu hồi" : "Tin nhắn đã bị xóa";
  }
  switch (row.type) {
    case "text":
      return row.content?.trim() || "";
    case "sticker":
      return "[Sticker]";
    case "image":
      return "[Ảnh]";
    case "file":
    case "voice":
    case "video":
    case "other":
      return "[Tệp]";
    case "system":
      return row.content?.trim() || "Thông báo";
    default:
      return row.content?.trim() || "";
  }
}
