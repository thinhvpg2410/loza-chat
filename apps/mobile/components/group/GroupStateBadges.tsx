import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText } from "@ui/AppText";
import type { GroupMemberRole } from "@features/group";
import { roleDisplayLabel } from "@features/group";
import { colors, radius } from "@theme";

export function GroupOnOffBadge({ on, style }: { on: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.onOffPill, on ? styles.onOffOn : styles.onOffOff, style]}>
      <AppText variant="micro" style={[styles.onOffTxt, on ? styles.onOffTxtOn : styles.onOffTxtOff]}>
        {on ? "Bật" : "Tắt"}
      </AppText>
    </View>
  );
}

export function GroupYesNoBadge({ yes, style }: { yes: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.onOffPill, yes ? styles.onOffOn : styles.onOffOff, style]}>
      <AppText variant="micro" style={[styles.onOffTxt, yes ? styles.onOffTxtOn : styles.onOffTxtOff]}>
        {yes ? "Có" : "Không"}
      </AppText>
    </View>
  );
}

export function GroupRoleBadge({ role }: { role: GroupMemberRole }) {
  const palette =
    role === "owner"
      ? { bg: "#fef3c7", border: "#fcd34d", fg: "#92400e" }
      : role === "admin"
        ? { bg: colors.primaryMuted, border: "#BFDBFE", fg: colors.primaryPressed }
        : { bg: colors.surface, border: colors.border, fg: colors.textSecondary };

  return (
    <View style={[styles.rolePill, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <AppText variant="micro" style={[styles.roleTxt, { color: palette.fg }]}>
        {roleDisplayLabel(role)}
      </AppText>
    </View>
  );
}

export function GroupJoinQueueKindBadge({ kind }: { kind: "self_request" | "invite_pending" }) {
  const isSelf = kind === "self_request";
  const palette = isSelf
    ? { bg: "#e0f2fe", border: "#7DD3FC", fg: "#075985" }
    : { bg: colors.surfaceSecondary, border: colors.border, fg: colors.textSecondary };

  return (
    <View style={[styles.kindPill, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <AppText variant="micro" style={[styles.kindTxt, { color: palette.fg }]}>
        {isSelf ? "Xin vào nhóm" : "Được mời (chờ)"}
      </AppText>
    </View>
  );
}

export function GroupPendingTag({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.kindPill, { backgroundColor: "#fef3c7", borderColor: "#fcd34d" }, style]}>
      <AppText variant="micro" style={[styles.kindTxt, { color: "#92400e" }]}>
        Chờ duyệt
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  onOffPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  onOffOn: {
    backgroundColor: "#DCFCE7",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#86EFAC",
  },
  onOffOff: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  onOffTxt: {
    fontWeight: "700",
    fontSize: 10,
    lineHeight: 13,
  },
  onOffTxtOn: {
    color: "#166534",
  },
  onOffTxtOff: {
    color: colors.textMuted,
  },
  rolePill: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  roleTxt: {
    fontWeight: "700",
    fontSize: 11,
    lineHeight: 14,
  },
  kindPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  kindTxt: {
    fontWeight: "700",
    fontSize: 10,
    lineHeight: 13,
  },
});
