import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, View } from "react-native";

import { AppTabScreen, EmptyState, SearchBarPlaceholder, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import { colors, spacing } from "@theme";

export default function FriendsTabScreen() {
  return (
    <AppTabScreen>
      <ShellHeader title="Bạn bè" />
      <SearchBarPlaceholder />
      <ScrollView>
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Pressable
              style={({ pressed }) => ({
                opacity: pressed ? 0.75 : 1,
                alignItems: "center",
                width: 72,
              })}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  backgroundColor: colors.primaryMuted,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="person-add-outline" size={20} color={colors.primary} />
              </View>
              <AppText variant="micro" color="textSecondary" style={{ marginTop: 6, textAlign: "center" }}>
                Thêm bạn
              </AppText>
            </Pressable>
            <Pressable
              style={({ pressed }) => ({
                opacity: pressed ? 0.75 : 1,
                alignItems: "center",
                width: 72,
              })}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="people-outline" size={20} color={colors.primary} />
              </View>
              <AppText variant="micro" color="textSecondary" style={{ marginTop: 6, textAlign: "center" }}>
                Nhóm
              </AppText>
            </Pressable>
          </View>
        </View>
        <EmptyState
          icon="people-outline"
          title="Danh bạ trống"
          description="Sẽ hiển thị bạn bè và gợi ý khi có API."
        />
      </ScrollView>
    </AppTabScreen>
  );
}
