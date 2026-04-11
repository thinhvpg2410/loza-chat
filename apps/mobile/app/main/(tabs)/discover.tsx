import { ScrollView, View } from "react-native";

import { AppTabScreen, EmptyState, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

const PLACEHOLDER_TILES = [
  { key: "mini", label: "Mini app" },
  { key: "games", label: "Trò chơi" },
  { key: "news", label: "News" },
  { key: "shop", label: "Shop" },
] as const;

export default function DiscoverTabScreen() {
  return (
    <AppTabScreen>
      <ShellHeader title="Khám phá" />
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {PLACEHOLDER_TILES.map((t) => (
            <View
              key={t.key}
              style={{
                width: "47%",
                paddingVertical: spacing.lg,
                paddingHorizontal: spacing.sm,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <AppText variant="subhead" style={{ fontWeight: "600", color: colors.text }}>
                {t.label}
              </AppText>
              <AppText variant="micro" color="textMuted" style={{ marginTop: 4 }}>
                Sắp có
              </AppText>
            </View>
          ))}
        </View>
        <EmptyState
          icon="compass-outline"
          title="Khám phá thêm"
          description="Lưới dịch vụ và gợi ý sẽ kết nối backend sau."
        />
      </ScrollView>
    </AppTabScreen>
  );
}
