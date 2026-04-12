import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import type { UserSession } from "@/services/sessions/sessionsApi";
import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

function platformLabel(platform: string): string {
  const p = platform.toLowerCase();
  if (p === "ios") return "iOS";
  if (p === "android") return "Android";
  if (p === "web") return "Web";
  return platform;
}

function formatLastSeen(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

function platformIconName(platform: string): keyof typeof Ionicons.glyphMap {
  const p = platform.toLowerCase();
  if (p === "ios") return "logo-apple";
  if (p === "android") return "logo-android";
  if (p === "web") return "globe-outline";
  return "phone-portrait-outline";
}

type SessionRowProps = {
  session: UserSession;
  onRevokePress: (session: UserSession) => void;
  busy: boolean;
};

export function SessionRow({ session, onRevokePress, busy }: SessionRowProps) {
  const title = session.deviceName?.trim() || platformLabel(session.platform);
  const subtitle = `${session.appVersion} · ${formatLastSeen(session.lastSeenAt)}`;

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={platformIconName(session.platform)} size={22} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="subhead" numberOfLines={1} style={styles.title}>
            {title}
          </AppText>
          {session.isCurrent ? (
            <View style={styles.pill}>
              <AppText variant="micro" style={styles.pillText}>
                Thiết bị này
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="caption" color="textMuted" numberOfLines={2} style={{ marginTop: 2 }}>
          {subtitle}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={session.isCurrent ? "Đăng xuất thiết bị này" : "Thu hồi phiên"}
        hitSlop={8}
        disabled={busy}
        onPress={() => onRevokePress(session)}
        style={({ pressed }) => ({ opacity: busy ? 0.45 : pressed ? 0.75 : 1, paddingVertical: spacing.xs, paddingLeft: spacing.sm })}
      >
        <AppText variant="micro" color="danger" style={{ fontWeight: "600" }}>
          {session.isCurrent ? "Đăng xuất" : "Thu hồi"}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  title: {
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1,
  },
  pill: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pillText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 11,
  },
});
