import Constants from "expo-constants";
import { Platform } from "react-native";

function trimEnv(value: string | undefined): string | undefined {
  return value?.trim();
}

const rawMock = trimEnv(process.env.EXPO_PUBLIC_USE_API_MOCK);
/** Chỉ khi giá trị (sau trim) là `false` thì tắt mock — tránh lỗi `.env` có khoảng trắng quanh `=`. */
export const USE_API_MOCK = (rawMock ?? "true").toLowerCase() !== "false";

const DEFAULT_API = "http://localhost:5000";

/**
 * Trên điện thoại thật, `localhost` trỏ vào chính máy điện thoại → lỗi mạng.
 * Nếu `EXPO_PUBLIC_API_URL` dùng localhost/127.0.0.1, thay host bằng IP của máy chạy Metro (hostUri).
 * Android emulator: dùng 10.0.2.2 khi không suy ra được host từ Metro.
 */
function resolveApiBaseUrl(): string {
  const raw = trimEnv(process.env.EXPO_PUBLIC_API_URL) ?? DEFAULT_API;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return raw.replace(/\/$/, "");
  }

  const needsDevHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (!needsDevHost) {
    return parsed.origin.replace(/\/$/, "");
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const bundlerHost = hostUri?.split(":")[0]?.trim();
  if (bundlerHost && bundlerHost !== "localhost" && bundlerHost !== "127.0.0.1") {
    parsed.hostname = bundlerHost;
    return parsed.origin.replace(/\/$/, "");
  }

  if (Platform.OS === "android") {
    parsed.hostname = "10.0.2.2";
    return parsed.origin.replace(/\/$/, "");
  }

  return parsed.origin.replace(/\/$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();
