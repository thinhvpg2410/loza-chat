import type { Message } from "@/lib/types/chat";

export function messageSnippet(m: Message): string {
  switch (m.kind) {
    case "text":
      return m.body.length > 80 ? `${m.body.slice(0, 80)}…` : m.body;
    case "image":
      return "[Ảnh]";
    case "file":
      return m.fileName;
    case "sticker":
      return m.emoji;
    case "system":
      return m.body;
    default:
      return "";
  }
}
