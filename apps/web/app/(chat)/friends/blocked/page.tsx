import { BlockedUsersWorkspace } from "@/components/friends/BlockedUsersWorkspace";
import { loadBlockedPageInitial } from "@/lib/friends/load-friends-pages";

export default async function BlockedFriendsPage() {
  const init = await loadBlockedPageInitial();

  if (init.source === "mock") {
    return <BlockedUsersWorkspace />;
  }

  return (
    <BlockedUsersWorkspace source="api" initialBlocked={init.blocked} initialError={init.error} />
  );
}
