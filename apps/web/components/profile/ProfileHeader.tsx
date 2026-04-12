import { Avatar } from "@/components/common/Avatar";
import type { ProfileUser } from "@/lib/types/social";

type ProfileHeaderProps = {
  user: ProfileUser;
};

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center border-b border-[var(--zalo-border)] px-4 pb-4 pt-2">
      <Avatar name={user.displayName} size="lg" src={user.avatarUrl} />
      <h2 className="mt-3 text-center text-[16px] font-semibold leading-tight text-[var(--zalo-text)]">
        {user.displayName}
      </h2>
      <p className="mt-1 text-center text-[12px] text-[var(--zalo-text-muted)]">
        {user.username ? `@${user.username}` : "Chưa đặt username"}
        {user.phone ? ` · ${user.phone}` : ""}
      </p>
      {user.bio ? (
        <p className="mt-2 max-w-[280px] text-center text-[13px] leading-snug text-[var(--zalo-text)]">
          {user.bio}
        </p>
      ) : null}
      {typeof user.mutualFriendsCount === "number" && !user.isSelf ? (
        <p className="mt-2 text-[12px] text-[var(--zalo-text-muted)]">
          {user.mutualFriendsCount} bạn chung
        </p>
      ) : null}
    </div>
  );
}
