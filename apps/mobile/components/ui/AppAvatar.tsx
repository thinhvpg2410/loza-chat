import { Image } from "expo-image";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { AppText } from "@ui/AppText";
import { avatarSizes, colors, radius, type AvatarSizeName } from "@theme";

type AppAvatarProps = {
  uri?: string | null;
  name?: string;
  size?: AvatarSizeName;
  style?: ViewStyle;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

const fallbackBg = ["#5B8DEF", "#7C6FDD", "#4EC2A8", "#E8956B", "#E86B9C"] as const;

function pickBg(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h + seed.charCodeAt(i)) % fallbackBg.length;
  }
  return fallbackBg[h];
}

export function AppAvatar({ uri, name = "", size = "md", style }: AppAvatarProps) {
  const dim = avatarSizes[size];
  const base: ViewStyle = {
    width: dim,
    height: dim,
    borderRadius: radius.full,
    overflow: "hidden",
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  };

  if (uri) {
    return (
      <View style={[base, style]}>
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim }}
          contentFit="cover"
          transition={120}
        />
      </View>
    );
  }

  const initials = initialsFromName(name);
  const bg = pickBg(name || initials);

  const textVariant = dim <= 30 ? "micro" : dim <= 40 ? "caption" : "subhead";

  return (
    <View style={[base, { backgroundColor: bg }, style]}>
      <AppText
        variant={textVariant}
        color="textInverse"
        style={{ fontWeight: "700", letterSpacing: -0.3 }}
      >
        {initials}
      </AppText>
    </View>
  );
}
