import { apiClient } from "@/services/api/client";

import type { PublicUserProfileDto } from "../users/usersPublicApi";

export type BlockedListEntryDto = {
  user: PublicUserProfileDto;
  blockedAt: string;
};

export async function fetchBlockedUsersApi(): Promise<BlockedListEntryDto[]> {
  const { data } = await apiClient.get<{ blocks: BlockedListEntryDto[] }>("/blocks");
  return data.blocks ?? [];
}

export async function blockUserApi(blockedId: string): Promise<void> {
  await apiClient.post("/blocks", { blockedId });
}

export async function unblockUserApi(blockedUserId: string): Promise<void> {
  await apiClient.delete(`/blocks/${blockedUserId}`);
}
