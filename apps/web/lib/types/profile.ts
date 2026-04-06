/** Subset of API `PublicUser` used by web settings. */
export type WebProfileUser = {
  id: string;
  displayName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  username: string | null;
  statusMessage: string | null;
  birthDate: string | null;
};
