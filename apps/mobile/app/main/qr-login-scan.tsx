import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CameraPermissionManager } from "@components/camera/CameraPermissionManager";
import { QrCodeScanner } from "@components/camera/QrCodeScanner";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import { parseQrLoginSessionToken } from "@lib/parseQrLoginSessionToken";
import {
  getApiErrorMessage,
  qrLoginApprove,
  qrLoginReject,
  qrLoginScan,
} from "@/services/api/api";
import { colors, spacing } from "@theme";

export default function QrLoginScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const scanLockRef = useRef(false);

  const unlockScan = useCallback(() => {
    scanLockRef.current = false;
  }, []);

  const promptApprove = useCallback(
    (sessionToken: string) => {
      Alert.alert(
        "Đăng nhập web",
        "Cho phép đăng nhập trình duyệt từ mã QR này?",
        [
          {
            text: "Hủy",
            style: "cancel",
            onPress: () => {
              unlockScan();
            },
          },
          {
            text: "Từ chối",
            style: "destructive",
            onPress: () => {
              void (async () => {
                try {
                  await qrLoginReject(sessionToken);
                } catch (e) {
                  Alert.alert("Lỗi", getApiErrorMessage(e, "Không gửi được từ chối."));
                } finally {
                  unlockScan();
                  router.back();
                }
              })();
            },
          },
          {
            text: "Đồng ý",
            onPress: () => {
              void (async () => {
                try {
                  await qrLoginApprove(sessionToken);
                  Alert.alert("Hoàn tất", "Trình duyệt sẽ đăng nhập trong giây lát.", [
                    { text: "OK", onPress: () => router.back() },
                  ]);
                } catch (e) {
                  Alert.alert("Lỗi", getApiErrorMessage(e, "Không xác nhận được."));
                  unlockScan();
                }
              })();
            },
          },
        ],
        { cancelable: true, onDismiss: unlockScan },
      );
    },
    [router, unlockScan],
  );

  const handleBarcode = useCallback(
    async (data: string) => {
      if (scanLockRef.current || busy) return;
      const sessionToken = parseQrLoginSessionToken(data);
      if (!sessionToken) {
        Alert.alert(
          "Mã không hợp lệ",
          "Không đọc được mã đăng nhập web. Quét lại mã QR trên trang đăng nhập web.",
        );
        return;
      }

      scanLockRef.current = true;
      setBusy(true);
      try {
        await qrLoginScan(sessionToken);
        setBusy(false);
        promptApprove(sessionToken);
      } catch (e) {
        setBusy(false);
        scanLockRef.current = false;
        Alert.alert("Lỗi", getApiErrorMessage(e, "Không quét được mã. Thử lại."));
      }
    },
    [busy, promptApprove],
  );

  const backButton = (
    <Pressable
      accessibilityLabel="Quay lại"
      hitSlop={12}
      onPress={() => router.back()}
      style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Ionicons name="chevron-back" size={26} color={colors.primary} />
    </Pressable>
  );

  const backButtonLight = (
    <Pressable
      accessibilityLabel="Quay lại"
      hitSlop={12}
      onPress={() => router.back()}
      style={({ pressed }) => [styles.backBtnLight, { opacity: pressed ? 0.75 : 1 }]}
    >
      <Ionicons name="chevron-back" size={26} color={colors.textInverse} />
    </Pressable>
  );

  if (USE_API_MOCK) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {backButton}
        <View style={styles.mockBox}>
          <AppText variant="subhead" style={{ color: colors.text, textAlign: "center" }}>
            Đăng nhập QR web cần API thật. Tắt EXPO_PUBLIC_USE_API_MOCK trong .env và khởi động lại Metro.
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <CameraPermissionManager
        leadingAccessory={backButton}
        deniedMessage="Cần quyền camera để quét mã QR đăng nhập web."
      >
        <QrCodeScanner
          onBarcodeScanned={(data) => {
            void handleBarcode(data);
          }}
          scanningEnabled={!busy}
        >
          <View style={[styles.overlayTop, { paddingTop: spacing.xs }]}>
            {backButtonLight}
            <AppText variant="subhead" style={styles.hint}>
              Hướng camera vào mã QR trên trang đăng nhập web
            </AppText>
          </View>
          {busy ? (
            <View style={styles.busyOverlay}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : null}
        </QrCodeScanner>
      </CameraPermissionManager>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backBtn: {
    alignSelf: "flex-start",
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  backBtnLight: {
    alignSelf: "flex-start",
    padding: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 999,
    marginLeft: spacing.sm,
  },
  mockBox: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  overlayTop: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2,
  },
  hint: {
    color: colors.textInverse,
    textAlign: "center",
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
});
