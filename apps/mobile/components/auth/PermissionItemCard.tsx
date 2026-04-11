import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { AppButton } from "@ui/AppButton";
import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

type IonName = ComponentProps<typeof Ionicons>["name"];

type PermissionItemCardProps = {
  icon: IonName;
  title: string;
  subtitle: string;
  allowed: boolean;
  onAllow: () => void;
};

export function PermissionItemCard({
  icon,
  title,
  subtitle,
  allowed,
  onAllow,
}: PermissionItemCardProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        marginBottom: spacing.xs,
        gap: spacing.sm,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.sm,
          backgroundColor: colors.primaryMuted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={19} color={colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="subhead" style={{ fontWeight: "600", color: colors.text, fontSize: 14, lineHeight: 19 }}>
          {title}
        </AppText>
        <AppText variant="micro" color="textSecondary" style={{ marginTop: 1, lineHeight: 16 }}>
          {subtitle}
        </AppText>
      </View>
      {allowed ? (
        <AppText variant="micro" color="success" style={{ fontWeight: "600" }}>
          Đã bật
        </AppText>
      ) : (
        <View style={{ minWidth: 80 }}>
          <AppButton title="Cho phép" size="sm" variant="outline" onPress={onAllow} />
        </View>
      )}
    </View>
  );
}
