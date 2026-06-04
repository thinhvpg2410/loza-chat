import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

type IonName = ComponentProps<typeof Ionicons>["name"];

type EmptyStateProps = {
  icon?: IonName;
  title: string;
  description?: string;
};

export function EmptyState({ icon = "file-tray-outline", title, description }: EmptyStateProps) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.xxxl,
      }}
    >
      <View
        style={{
          marginBottom: spacing.md,
          width: 68,
          height: 68,
          borderRadius: radius.full,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={32} color={colors.textMuted} />
      </View>
      <AppText variant="headline" style={{ fontWeight: "600", color: colors.text, textAlign: "center" }}>
        {title}
      </AppText>
      {description ? (
        <AppText
          variant="subhead"
          color="textSecondary"
          style={{ marginTop: spacing.xs, textAlign: "center", lineHeight: 20 }}
        >
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
