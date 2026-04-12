import type { PublicUser } from '../../../common/utils/user-public';

/** `request.user` after JWT validation; `tokenDeviceId` is not exposed on profile APIs. */
export type AuthenticatedUser = PublicUser & { tokenDeviceId?: string };
