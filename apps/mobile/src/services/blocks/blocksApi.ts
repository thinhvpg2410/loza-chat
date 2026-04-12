import { apiClient } from "@/services/api/client";

export async function blockUserApi(blockedId: string): Promise<void> {
  await apiClient.post("/blocks", { blockedId });
}

export async function unblockUserApi(blockedUserId: string): Promise<void> {
  await apiClient.delete(`/blocks/${blockedUserId}`);
}
