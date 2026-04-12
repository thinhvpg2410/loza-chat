import { FriendRequestsWorkspace } from "@/components/friends/FriendRequestsWorkspace";
import { loadFriendRequestsPageInitial } from "@/lib/friends/load-friends-pages";

export default async function FriendRequestsPage() {
  const init = await loadFriendRequestsPageInitial();

  if (init.source === "mock") {
    return <FriendRequestsWorkspace />;
  }

  return (
    <FriendRequestsWorkspace
      source="api"
      initialIncoming={init.incoming}
      initialOutgoing={init.outgoing}
      initialError={init.error}
    />
  );
}
