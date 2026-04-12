"use server";

import { revalidatePath } from "next/cache";
import { apiFetchJson } from "@/lib/api/server";
import { getWebApiSession } from "@/lib/auth/web-api-session";

export type CreateDirectResult =
  | { ok: true; conversationId: string }
  | { ok: false; error: string };

export async function createOrGetDirectConversationAction(
  targetUserId: string,
): Promise<CreateDirectResult> {
  const session = await getWebApiSession();
  if (!session.active) {
    return { ok: false, error: "Đăng nhập qua API để nhắn tin." };
  }
  try {
    const { conversation } = await apiFetchJson<{ conversation: { id: string } }>(
      "/conversations/direct",
      {
        method: "POST",
        body: JSON.stringify({ targetUserId }),
      },
    );
    revalidatePath("/");
    return { ok: true, conversationId: conversation.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không mở được cuộc trò chuyện.",
    };
  }
}
