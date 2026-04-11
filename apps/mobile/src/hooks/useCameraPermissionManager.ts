import { useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useMemo } from "react";
import { AppState, type AppStateStatus, Linking } from "react-native";

export type CameraPermissionPhase = "loading" | "denied" | "granted";

export type UseCameraPermissionManagerOptions = {
  /**
   * When true, calls the native request flow as soon as the hook mounts (via expo-camera hook).
   * On iOS + Expo Go this helps: the system dialog appears without an extra tap, and
   * Settings › Privacy › Camera will list "Expo Go" only after a request has occurred.
   */
  requestOnMount?: boolean;
};

export function useCameraPermissionManager(options: UseCameraPermissionManagerOptions = {}) {
  const { requestOnMount = false } = options;
  const [permission, requestPermission, getPermission] = useCameraPermissions(
    requestOnMount ? { request: true } : undefined,
  );

  useEffect(() => {
    const onAppState = (state: AppStateStatus) => {
      if (state === "active") void getPermission();
    };
    const sub = AppState.addEventListener("change", onAppState);
    return () => sub.remove();
  }, [getPermission]);

  const phase: CameraPermissionPhase = useMemo(() => {
    if (permission === null) return "loading";
    return permission.granted ? "granted" : "denied";
  }, [permission]);

  const openAppSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  return {
    phase,
    permission,
    requestPermission,
    getPermission,
    openAppSettings,
  };
}
