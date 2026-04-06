import AsyncStorage from "@react-native-async-storage/async-storage";

import { ONBOARDING_COMPLETE_KEY } from "@/constants/storageKeys";
import { useAuthStore } from "@/store/authStore";

/**
 * Persists onboarding + mock session so the app can open the Expo Router `/main` shell.
 * Replace with real API integration later.
 */
export async function completeMockOnboardingSession(params: {
  displayName: string;
  phoneE164: string;
  avatarUri?: string | null;
}): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
  await useAuthStore.getState().login({
    accessToken: "mock-access-token",
    user: {
      id: "mock-user-1",
      name: params.displayName,
      phone: params.phoneE164,
      ...(params.avatarUri ? { avatarUri: params.avatarUri } : {}),
    },
  });
}

export function buildE164(countryDial: string, nationalDigits: string): string {
  let d = nationalDigits.replace(/\D/g, "");
  if (d.startsWith("0")) {
    d = d.slice(1);
  }
  const prefix = countryDial.startsWith("+") ? countryDial : `+${countryDial}`;
  return `${prefix}${d}`;
}

export function isValidVnLength(nationalDigits: string): boolean {
  const d = nationalDigits.replace(/\D/g, "");
  return d.length >= 9 && d.length <= 10;
}
