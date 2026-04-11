import type { AuthUser } from "@/store/authStore";

type PublicUserLike = {
  id: string;
  displayName: string;
  phoneNumber: string | null;
  email?: string | null;
  avatarUrl: string | null;
  username?: string | null;
  statusMessage?: string | null;
  birthDate?: string | Date | null;
};

function toBirthDateIso(v: PublicUserLike["birthDate"]): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

/** Maps Nest `PublicUser` fields to the mobile `AuthUser` shape. */
export function mapPublicUserToAuthUser(u: PublicUserLike): AuthUser {
  const bd = toBirthDateIso(u.birthDate);
  const email = u.email?.trim();
  return {
    id: u.id,
    name: u.displayName,
    phone: u.phoneNumber ?? "",
    ...(email ? { email } : {}),
    avatarUri: u.avatarUrl ?? undefined,
    username: u.username ?? undefined,
    statusMessage: u.statusMessage ?? undefined,
    ...(bd === undefined ? {} : { birthDate: bd }),
  };
}
