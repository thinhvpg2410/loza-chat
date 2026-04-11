import type { ReactNode } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import {
  useCameraPermissionManager,
  type CameraPermissionPhase,
} from "@/hooks/useCameraPermissionManager";
import { colors, spacing } from "@theme";

export type CameraPermissionManagerProps = {
  children: ReactNode;
  /** Prepended in loading and denied states (e.g. back button). */
  leadingAccessory?: ReactNode;
  deniedMessage?: string;
  requestButtonLabel?: string;
  openSettingsLabel?: string;
  /**
   * Triggers native camera permission when this screen mounts (recommended for QR / Expo Go iOS).
   */
  requestCameraOnMount?: boolean;
  /** Override loading UI (still inside padded column after leadingAccessory). */
  renderLoading?: (phase: CameraPermissionPhase) => ReactNode;
  /** Override denied UI; receives actions from the permission hook. */
  renderDenied?: (args: {
    requestPermission: () => Promise<unknown>;
    openAppSettings: () => void;
  }) => ReactNode;
};

const defaultDeniedMessage = "Cần quyền camera để quét mã QR.";

export function CameraPermissionManager({
  children,
  leadingAccessory,
  deniedMessage = defaultDeniedMessage,
  requestButtonLabel = "Cấp quyền camera",
  openSettingsLabel = "Mở Cài đặt",
  requestCameraOnMount = true,
  renderLoading,
  renderDenied,
}: CameraPermissionManagerProps) {
  const { phase, requestPermission, openAppSettings } = useCameraPermissionManager({
    requestOnMount: requestCameraOnMount,
  });

  if (phase === "granted") {
    return <>{children}</>;
  }

  if (phase === "loading") {
    return (
      <View style={styles.column}>
        {leadingAccessory}
        <View style={styles.flexCenter}>
          {renderLoading?.(phase) ?? <ActivityIndicator color={colors.primary} />}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.column}>
      {leadingAccessory}
      <View style={styles.deniedBody}>
        {renderDenied?.({ requestPermission, openAppSettings }) ?? (
          <>
            <AppText variant="subhead" style={styles.deniedText}>
              {deniedMessage}
            </AppText>
            <Pressable
              onPress={() => void requestPermission()}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
            >
              <AppText variant="subhead" color="textInverse" style={{ fontWeight: "600" }}>
                {requestButtonLabel}
              </AppText>
            </Pressable>
            <Pressable
              onPress={openAppSettings}
              style={{ marginTop: spacing.sm, padding: spacing.sm }}
            >
              <AppText variant="micro" color="primary" style={{ textAlign: "center" }}>
                {openSettingsLabel}
              </AppText>
            </Pressable>
            {Platform.OS === "ios" ? (
              <AppText
                variant="micro"
                style={{
                  marginTop: spacing.md,
                  textAlign: "center",
                  color: colors.text,
                  opacity: 0.72,
                }}
              >
                Expo Go: Cài đặt › Expo Go › Camera — hoặc Quyền riêng tư và Bảo mật › Camera › bật Expo Go.
              </AppText>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flexCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deniedBody: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  deniedText: {
    color: colors.text,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
});
