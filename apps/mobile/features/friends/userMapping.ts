import type { MockFriend } from "@/constants/mockData";

import type { PublicUserProfileDto, UserSearchResultDto } from "@/services/users/usersPublicApi";

export function avatarFallbackForName(name: string): string {
  const q = encodeURIComponent(name.slice(0, 2) || "?");
  return `https://ui-avatars.com/api/?name=${q}&background=E8E8E8&color=444`;
}

export function mapPublicProfileToMockFriend(
  p: PublicUserProfileDto,
  opts?: { subtitle?: string; isOnline?: boolean },
): MockFriend {
  const name = p.displayName?.trim() || "Người dùng";
  return {
    id: p.id,
    name,
    avatarUrl: p.avatarUrl ?? avatarFallbackForName(name),
    isOnline: opts?.isOnline ?? false,
    subtitle: opts?.subtitle ?? p.statusMessage ?? (p.username ? `@${p.username}` : undefined),
    username: p.username ?? undefined,
  };
}

export function mapSearchResultToMockFriend(row: UserSearchResultDto): MockFriend {
  return mapPublicProfileToMockFriend(row);
}

/**
 * Backend requires exactly one of phoneNumber (E.164), email, or username (3–30, [a-z0-9_]).
 */
export function parseUserSearchInput(raw: string): { phoneNumber?: string; email?: string; username?: string } | null {
  const q = raw.trim();
  if (q.length < 2) return null;

  if (q.includes("@")) {
    return { email: q.toLowerCase() };
  }

  const compact = q.replace(/\s/g, "");
  if (compact.startsWith("+")) {
    if (/^\+[1-9]\d{6,14}$/.test(compact)) {
      return { phoneNumber: compact };
    }
    return null;
  }

  const digits = compact.replace(/\D/g, "");
  if (digits.length >= 9 && digits.length <= 14) {
    if (digits.startsWith("84")) {
      return { phoneNumber: `+${digits}` };
    }
    if (digits.startsWith("0") && digits.length >= 10) {
      return { phoneNumber: `+84${digits.slice(1)}` };
    }
    if (digits.length >= 9 && digits.length <= 11) {
      return { phoneNumber: `+84${digits}` };
    }
  }

  const u = q.toLowerCase();
  if (u.length >= 3 && u.length <= 30 && /^[a-z0-9_]+$/.test(u)) {
    return { username: u };
  }

  return null;
}
