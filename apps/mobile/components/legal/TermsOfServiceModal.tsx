import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import { TERMS_INTRO_VI, TERMS_OF_SERVICE_SECTIONS } from "@/constants/termsOfServiceVi";
import { colors, radius, spacing } from "@theme";

type TermsOfServiceModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function TermsOfServiceModal({ visible, onClose }: TermsOfServiceModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <AppText variant="title" style={styles.headerTitle}>
          Điều khoản và dịch vụ
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          onPress={onClose}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator
      >
        <AppText variant="caption" color="textSecondary" style={styles.intro}>
          {TERMS_INTRO_VI}
        </AppText>
        {TERMS_OF_SERVICE_SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <AppText variant="subhead" style={styles.sectionTitle}>
              {s.title}
            </AppText>
            <AppText variant="body" color="textSecondary" style={styles.sectionBody}>
              {s.body}
            </AppText>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
        >
          <AppText variant="subhead" style={styles.primaryBtnText}>
            Đã hiểu
          </AppText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { flex: 1, paddingRight: spacing.sm },
  closeBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  closeBtnPressed: { opacity: 0.65 },
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  intro: { marginBottom: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: { marginBottom: spacing.xs, fontWeight: "600" },
  sectionBody: { lineHeight: 22 },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  primaryBtnPressed: { opacity: 0.88 },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
});
