import type { MockFriend } from "@/constants/mockData";
import { USE_API_MOCK } from "@/constants/env";
import { getApiErrorMessage } from "@/services/api/api";
import {
  fetchFriendsListApi,
  fetchIncomingFriendRequestsApi,
  fetchOutgoingFriendRequestsApi,
} from "@/services/friends/friendsApi";
import { mapPublicProfileToMockFriend } from "@features/friends/userMapping";
import { create } from "zustand";

export type FriendRequestListItem = {
  requestId: string;
  peer: MockFriend;
  message: string | null;
};

type FriendsState = {
  friends: MockFriend[];
  incoming: FriendRequestListItem[];
  outgoing: FriendRequestListItem[];
  loading: boolean;
  hasLoadedOnce: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reset: () => void;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  incoming: [],
  outgoing: [],
  loading: false,
  hasLoadedOnce: false,
  error: null,

  refresh: async () => {
    if (USE_API_MOCK) {
      set({ loading: true, error: null });
      await delay(500);
      set({ loading: false, hasLoadedOnce: true, error: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const [friendRows, incomingRows, outgoingRows] = await Promise.all([
        fetchFriendsListApi(),
        fetchIncomingFriendRequestsApi(),
        fetchOutgoingFriendRequestsApi(),
      ]);

      set({
        friends: friendRows.map((f) =>
          mapPublicProfileToMockFriend(f, {
            subtitle: f.statusMessage ?? (f.username ? `@${f.username}` : undefined),
          }),
        ),
        incoming: incomingRows.map((r) => ({
          requestId: r.id,
          peer: mapPublicProfileToMockFriend(r.sender, {
            subtitle: r.message ?? undefined,
          }),
          message: r.message,
        })),
        outgoing: outgoingRows.map((r) => ({
          requestId: r.id,
          peer: mapPublicProfileToMockFriend(r.receiver),
          message: r.message,
        })),
        loading: false,
        hasLoadedOnce: true,
        error: null,
      });
    } catch (e) {
      set({
        loading: false,
        hasLoadedOnce: true,
        error: getApiErrorMessage(e),
      });
    }
  },

  reset: () =>
    set({
      friends: [],
      incoming: [],
      outgoing: [],
      loading: false,
      hasLoadedOnce: false,
      error: null,
    }),
}));
