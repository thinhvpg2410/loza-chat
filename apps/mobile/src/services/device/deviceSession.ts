import { appStorage } from "@/storage/appStorage";
import Constants from "expo-constants";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "loza_device_id";

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i += 1) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await appStorage.getItem(DEVICE_ID_KEY);
  if (existing && existing.length >= 8) {
    return existing;
  }
  const next = `loza-${randomHex(16)}`;
  await appStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

export type DeviceSessionPayload = {
  deviceId: string;
  platform: "ios" | "android" | "web" | "other";
  appVersion: string;
  deviceName?: string;
};

export async function getDeviceSessionPayload(): Promise<DeviceSessionPayload> {
  const deviceId = await getOrCreateDeviceId();
  const os = Platform.OS;
  const platform: DeviceSessionPayload["platform"] =
    os === "ios" ? "ios" : os === "android" ? "android" : os === "web" ? "web" : "other";
  const appVersion =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";
  const deviceName =
    Platform.select({
      ios: Constants.deviceName ?? undefined,
      android: Constants.deviceName ?? undefined,
      default: undefined,
    }) ?? undefined;

  return {
    deviceId,
    platform,
    appVersion,
    ...(deviceName ? { deviceName } : {}),
  };
}
