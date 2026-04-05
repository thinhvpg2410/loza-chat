import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useEffect } from "react";

import { mainTabBarStyle } from "@/navigation/tabBarStyles";
import type { TabParamList } from "@/navigation/types";
import { ContactsScreen } from "@/screens/home/ContactsScreen";
import { DiscoverScreen } from "@/screens/home/DiscoverScreen";
import { MessagesScreen } from "@/screens/home/MessagesScreen";
import { MomentsScreen } from "@/screens/home/MomentsScreen";
import { ProfileScreen } from "@/screens/home/ProfileScreen";
import { useChatStore } from "@/store/chatStore";

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const conversations = useChatStore((s) => s.conversations);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0085FF",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: mainTabBarStyle,
      }}
    >
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          title: "Tin nhắn",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={color} />
          ),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          title: "Danh bạ",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          title: "Khám phá",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={size} color={color} />
          ),
          tabBarBadge: " ",
          tabBarBadgeStyle: {
            backgroundColor: "#ef4444",
            minWidth: 8,
            maxHeight: 8,
            borderRadius: 4,
            alignSelf: "flex-start",
          },
        }}
      />
      <Tab.Screen
        name="Moments"
        component={MomentsScreen}
        options={{
          title: "Nhật ký",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "time" : "time-outline"} size={size} color={color} />
          ),
          tabBarBadge: "N",
          tabBarBadgeStyle: { backgroundColor: "#ef4444", fontSize: 10, minWidth: 18 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
