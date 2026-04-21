"use client";

import { useMemo } from "react";
import type { ApiGroupDetail } from "@/lib/chat/api-dtos";
import { buildGroupPermissionFlags, type GroupPermissionFlags } from "@/lib/types/groups";

export function useGroupPermissions(detail: ApiGroupDetail | null, viewerUserId: string | null): GroupPermissionFlags {
  return useMemo(() => buildGroupPermissionFlags(detail, viewerUserId), [detail, viewerUserId]);
}
