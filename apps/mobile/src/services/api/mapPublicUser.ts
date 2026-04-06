import type { AuthUser } from "@/store/authStore";

/** Maps Nest `PublicUser` fields to the mobile `AuthUser` shape. */
export function mapPublicUserToAuthUser(u: {
  id: string;
  displayName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
}): AuthUser {
  return {
    id: u.id,
    name: u.displayName,
    phone: u.phoneNumber ?? "",
    avatarUri: u.avatarUrl ?? undefined,
  };
}
