import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Tabs } from "expo-router";
import { useCallback, useEffect } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MOCK_INCOMING_FRIEND_REQUESTS } from "@/constants/mockData";
import { USE_API_MOCK } from "@/constants/env";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useFriendsStore } from "@/store/friendsStore";
import { useUserStore } from "@/store/userStore";
import { colors } from "@theme";

export default function MainTabsLayout() {
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const conversations = useChatStore((s) => s.conversations);

  useEffect(() => {
    useUserStore.getState().setUserFromAuth(authUser);
  }, [authUser]);

  useFocusEffect(
    useCallback(() => {
      void useAuthStore.getState().syncProfileFromServer();
    }, []),
  );

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  const incomingFriendRequests = useFriendsStore((s) => s.incoming.length);

  useEffect(() => {
    if (USE_API_MOCK) return;
    void useFriendsStore.getState().refresh();
  }, []);

  const friendsTabBadgeCount = USE_API_MOCK ? MOCK_INCOMING_FRIEND_REQUESTS.length : incomingFriendRequests;
  const friendsTabBadge =
    friendsTabBadgeCount > 0 ? (friendsTabBadgeCount > 99 ? "99+" : friendsTabBadgeCount) : undefined;

  const TAB_HEIGHT = 52;
  const tabBarStyle = [
    styles.tabBar,
    {
      height: TAB_HEIGHT + insets.bottom,
      paddingBottom: insets.bottom || 4,
    },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tin nhắn",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={22} color={color} />
          ),
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? "99+" : totalUnread) : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Bạn bè",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={22} color={color} />
          ),
          tabBarBadge: friendsTabBadge,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Khám phá",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "compass" : "compass-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 5,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: -2,
  },
  tabItem: {
    paddingTop: 2,
  },
  badge: {
    backgroundColor: colors.danger,
    fontSize: 10,
    minWidth: 18,
    fontWeight: "700",
  },
});
