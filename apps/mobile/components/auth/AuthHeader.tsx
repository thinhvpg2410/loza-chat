import { useRouter } from "expo-router";
import { View } from "react-native";

import { AppIconButton } from "@ui/AppIconButton";
import { AppText } from "@ui/AppText";
import { colors, spacing } from "@theme";

type AuthHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
};

export function AuthHeader({ title, subtitle, showBack = true }: AuthHeaderProps) {
  const router = useRouter();

  return (
    <View style={{ marginBottom: spacing.lg }}>
      {showBack ? (
        <View style={{ marginBottom: spacing.sm, marginLeft: -spacing.xs }}>
          <AppIconButton
            name="chevron-back"
            size="sm"
            accessibilityLabel="Quay lại"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              }
            }}
          />
        </View>
      ) : null}
      <AppText
        variant="display"
        style={{ color: colors.text, fontWeight: "700", letterSpacing: -0.5 }}
      >
        {title}
      </AppText>
      {subtitle ? (
        <AppText
          variant="subhead"
          color="textSecondary"
          style={{ marginTop: spacing.xs, lineHeight: 20 }}
        >
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}
