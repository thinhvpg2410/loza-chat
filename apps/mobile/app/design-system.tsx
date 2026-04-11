import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import {
  AppAvatar,
  AppBadge,
  AppButton,
  AppDivider,
  AppHeader,
  AppIconButton,
  AppInput,
  AppScreen,
  AppText,
} from "@ui";
import { colors, radius, shadows, spacing } from "@theme";

export default function DesignSystemScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");

  return (
    <AppScreen scroll horizontalPadding="lg" safeEdges={["top", "left", "right"]}>
      <AppHeader
        title="Design system"
        subtitle="Phase M1 · Zalo-like foundation"
        left={
          <AppIconButton
            name="chevron-back"
            accessibilityLabel="Back"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
          />
        }
        right={<AppIconButton name="ellipsis-horizontal" accessibilityLabel="More" />}
      />

      <View style={{ marginTop: spacing.md }}>
        <AppText variant="headline" style={{ marginBottom: spacing.sm }}>
          Typography
        </AppText>
        <AppText variant="title">Title — screen title</AppText>
        <AppText variant="headline" style={{ marginTop: spacing.xs }}>
          Headline — row title
        </AppText>
        <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
          Body — main content in lists and chat bubbles.
        </AppText>
        <AppText variant="subhead" color="textMuted" style={{ marginTop: spacing.xs }}>
          Subhead — secondary line
        </AppText>
        <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
          Caption — time & hints
        </AppText>
        <AppText variant="micro" color="primary" style={{ marginTop: spacing.xs }}>
          Micro — badge / meta
        </AppText>
      </View>

      <AppDivider verticalSpacing="md" />

      <AppText variant="headline" style={{ marginBottom: spacing.sm }}>
        Buttons
      </AppText>
      <View style={{ gap: spacing.sm }}>
        <AppButton title="Primary" variant="primary" onPress={() => undefined} />
        <AppButton title="Secondary" variant="secondary" onPress={() => undefined} />
        <AppButton title="Outline" variant="outline" onPress={() => undefined} />
        <AppButton title="Ghost" variant="ghost" onPress={() => undefined} />
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppButton title="Small" size="sm" variant="primary" onPress={() => undefined} />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton title="Loading" loading variant="primary" onPress={() => undefined} />
          </View>
        </View>
      </View>

      <AppDivider verticalSpacing="md" />

      <AppText variant="headline" style={{ marginBottom: spacing.sm }}>
        Input
      </AppText>
      <AppInput
        label="Phone or email"
        placeholder="Enter phone number"
        value={input}
        onChangeText={setInput}
        keyboardType="phone-pad"
      />
      <View style={{ height: spacing.md }} />
      <AppInput label="With error" value="" placeholder="Required" error="This field is required" />

      <AppDivider verticalSpacing="md" />

      <AppText variant="headline" style={{ marginBottom: spacing.sm }}>
        Avatars
      </AppText>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.md }}>
        <AppAvatar name="Lan Anh" size="xs" />
        <AppAvatar name="Minh Tuấn" size="sm" />
        <AppAvatar name="Hải Đăng" size="md" />
        <AppAvatar name="Thu Hà" size="lg" />
        <AppAvatar
          uri="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&h=128&fit=crop"
          name="Photo"
          size="md"
        />
      </View>

      <AppDivider verticalSpacing="md" />

      <AppText variant="headline" style={{ marginBottom: spacing.sm }}>
        Badges & icons
      </AppText>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
        <View style={{ alignItems: "center" }}>
          <AppBadge count={3} />
          <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
            Count
          </AppText>
        </View>
        <View style={{ alignItems: "center" }}>
          <AppBadge count={120} />
          <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
            99+
          </AppText>
        </View>
        <View style={{ alignItems: "center" }}>
          <AppBadge dot />
          <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
            Dot
          </AppText>
        </View>
        <View style={{ alignItems: "center" }}>
          <AppBadge count="NEW" variant="primary" />
          <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
            Label
          </AppText>
        </View>
        <AppIconButton name="chatbubble-ellipses-outline" accessibilityLabel="Chat" />
      </View>

      <AppDivider verticalSpacing="md" insetLeft={spacing.lg} />

      <AppText variant="headline" style={{ marginBottom: spacing.sm }}>
        Surfaces
      </AppText>
      <View
        style={[
          {
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
          },
          shadows.sm,
        ]}
      >
        <AppText variant="subhead">List row / card surface</AppText>
        <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
          Subtle border, light gray fill, minimal shadow.
        </AppText>
      </View>

      <View style={{ height: spacing.xxxl }} />
    </AppScreen>
  );
}
