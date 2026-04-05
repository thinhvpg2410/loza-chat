import type { MockFriend, MockPost } from "@/constants/mockData";
import { MOCK_FRIENDS, MOCK_POSTS } from "@/constants/mockData";
import type { AuthUser } from "@/store/authStore";
import { create } from "zustand";

export type StoreUser = {
  id: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
};

type UserState = {
  user: StoreUser | null;
  friends: MockFriend[];
  posts: MockPost[];
  friendsLoading: boolean;
  postsLoading: boolean;
  setUserFromAuth: (authUser: AuthUser | null) => void;
  fetchFriends: () => Promise<void>;
  fetchPosts: () => Promise<void>;
  reset: () => void;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useUserStore = create<UserState>((set) => ({
  user: null,
  friends: [],
  posts: [],
  friendsLoading: false,
  postsLoading: false,

  setUserFromAuth: (authUser) => {
    if (!authUser) {
      set({ user: null });
      return;
    }
    set({
      user: {
        id: authUser.id,
        name: authUser.name,
        avatarUrl: authUser.avatarUri,
      },
    });
  },

  fetchFriends: async () => {
    set({ friendsLoading: true });
    await delay(700);
    set({ friends: [...MOCK_FRIENDS], friendsLoading: false });
  },

  fetchPosts: async () => {
    set({ postsLoading: true });
    await delay(700);
    set({ posts: [...MOCK_POSTS], postsLoading: false });
  },

  reset: () =>
    set({
      user: null,
      friends: [],
      posts: [],
      friendsLoading: false,
      postsLoading: false,
    }),
}));
