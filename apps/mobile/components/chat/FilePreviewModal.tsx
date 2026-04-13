import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import { colors } from "@theme";

type FilePreviewModalProps = {
  visible: boolean;
  title: string;
  embedUrl: string | null;
  /** Direct file URL (open in browser). */
  downloadUrl: string | null;
  onClose: () => void;
};

export function FilePreviewModal({
  visible,
  title,
  embedUrl,
  downloadUrl,
  onClose,
}: FilePreviewModalProps) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const webHeight = Math.max(320, Math.floor(winH * 0.72));

  const openExternal = useCallback(async () => {
    if (!downloadUrl) return;
    await WebBrowser.openBrowserAsync(downloadUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
  }, [downloadUrl]);

  if (!embedUrl) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AppText variant="subhead" numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
        <View style={styles.headerActions}>
          {downloadUrl ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mở trong trình duyệt"
              onPress={() => void openExternal()}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            >
              <Ionicons name="open-outline" size={22} color={colors.primary} />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            onPress={onClose}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>
      </View>
      
      <View style={[styles.webWrap, { height: webHeight }]}>
        <WebView
          source={{ uri: embedUrl }}
          style={styles.web}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          allowsInlineMediaPlayback
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.75,
  },
  hint: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surfaceSecondary,
  },
  webWrap: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  web: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
});
