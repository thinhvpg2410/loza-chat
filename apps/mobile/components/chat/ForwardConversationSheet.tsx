import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import { AppAvatar } from "@ui/AppAvatar";
import { colors, radius, spacing } from "@theme";

type ForwardTarget = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type ForwardConversationSheetProps = {
  visible: boolean;
  loading?: boolean;
  targets: ForwardTarget[];
  onClose: () => void;
  onPick: (targetConversationId: string) => void;
};

export function ForwardConversationSheet({
  visible,
  loading = false,
  targets,
  onClose,
  onPick,
}: ForwardConversationSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Đóng" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
          <AppText variant="subhead" style={styles.title}>
            Chuyển tiếp đến
          </AppText>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {targets.map((t) => (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                onPress={() => onPick(t.id)}
                disabled={loading}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed, loading && styles.rowDisabled]}
              >
                <AppAvatar uri={t.avatarUrl} name={t.name} size="sm" />
                <AppText variant="subhead" style={styles.name} numberOfLines={1}>
                  {t.name}
                </AppText>
              </Pressable>
            ))}
            {!targets.length ? (
              <View style={styles.emptyWrap}>
                <AppText variant="subhead" color="textSecondary" style={styles.emptyText}>
                  Không có cuộc trò chuyện phù hợp để chuyển tiếp.
                </AppText>
              </View>
            ) : null}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && styles.rowPressed]}
          >
            <AppText variant="subhead" color="textSecondary" style={{ fontWeight: "600" }}>
              Hủy
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: "60%",
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  title: {
    textAlign: "center",
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontWeight: "500",
  },
  emptyWrap: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  cancel: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
});
