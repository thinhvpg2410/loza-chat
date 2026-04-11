import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

import { AppTabScreen, ListRowSkeleton, SearchBarPlaceholder, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import { colors, spacing } from "@theme";

export default function SearchScreen() {
  const router = useRouter();

  return (
    <AppTabScreen edges={["top", "left", "right", "bottom"]}>
      <ShellHeader
        title="Tìm kiếm"
        left={
          <Pressable
            accessibilityLabel="Quay lại"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
        }
      />
      <SearchBarPlaceholder hint="Tìm tin nhắn, bạn bè, nhóm…" />
      <ScrollView>
        <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
          <AppText variant="caption" color="textMuted">
            Gợi ý gần đây (mock)
          </AppText>
        </View>
        <ListRowSkeleton count={4} />
      </ScrollView>
    </AppTabScreen>
  );
}
