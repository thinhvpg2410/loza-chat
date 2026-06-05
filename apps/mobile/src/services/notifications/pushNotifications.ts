/**
 * Push notification setup for incoming calls when the app is backgrounded.
 *
 * Call flow when app is in background:
 * 1. Server sends FCM/APNs push with data.type = 'incoming_call'
 * 2. Expo shows a notification banner
 * 3. User taps → app opens → notification response handler fires
 * 4. App navigates / shows IncomingCallModal via deep link or router
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiClient } from "@/services/api/client";
import { getOrCreateDeviceId } from "@/services/device/deviceSession";

// Configure how notifications are presented when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as Record<string, unknown>;
    const isCall = data?.type === "incoming_call";
    return {
      shouldShowBanner: isCall,
      shouldShowList: false,
      shouldPlaySound: false, // We play our own ringtone via call-sounds.ts
      shouldSetBadge: false,
    };
  },
});

export type IncomingCallNotificationData = {
  callId: string;
  callType: "voice" | "video";
  callerId: string;
  callerName: string;
  callerAvatarUrl: string;
  conversationId: string;
  isGroup: string; // string because FCM data is all strings
};

/**
 * Request notification permissions and register push token with the server.
 * Call this once after login, ideally in the app root.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (Platform.OS === "web") return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return;
  }

  // Android notification channel for incoming calls
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("incoming_call", {
      name: "Cuộc gọi đến",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 800, 400, 800],
      sound: "ringtone",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const deviceId = await getOrCreateDeviceId();

    await apiClient.post("/sessions/push-token", {
      deviceId,
      pushToken: tokenData.data,
      platform: Platform.OS as "ios" | "android",
    });
  } catch {
    // Non-fatal — push notifications won't work but the app still functions
  }
}

/**
 * Clear push token on logout so the device no longer receives call notifications.
 */
export async function unregisterPushNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const deviceId = await getOrCreateDeviceId();
    await apiClient.delete("/sessions/push-token", { data: { deviceId } });
  } catch {
    /* ignore */
  }
}

/**
 * Subscribe to notification tap events. Returns an unsubscribe function.
 * When user taps an incoming_call notification, the callback fires with call data.
 */
export function subscribeToCallNotifications(
  onIncomingCall: (data: IncomingCallNotificationData) => void,
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as Record<
        string,
        unknown
      >;
      if (data?.type === "incoming_call") {
        onIncomingCall(data as IncomingCallNotificationData);
      }
    },
  );
  return () => sub.remove();
}
