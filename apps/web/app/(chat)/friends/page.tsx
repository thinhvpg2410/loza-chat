import { FriendsWorkspace } from "@/components/friends/FriendsWorkspace";
import { loadFriendsPageInitial } from "@/lib/friends/load-friends-pages";

export default async function FriendsPage() {
  const init = await loadFriendsPageInitial();

  if (init.source === "mock") {
    return <FriendsWorkspace />;
  }

  return (
    <FriendsWorkspace
      source="api"
      initialFriends={init.friends}
      initialError={init.error}
      selfProfile={init.selfProfile}
      incomingRequestCount={init.incomingRequestCount}
    />
  );
}
