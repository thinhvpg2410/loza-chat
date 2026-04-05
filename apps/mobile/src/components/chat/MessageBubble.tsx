import { formatChatTime } from "@/utils/formatChatTime";
import type { ChatMessage } from "@/types/chat";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { memo, useCallback, type ReactNode } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

type MessageBubbleProps = {
  message: ChatMessage;
  isMine: boolean;
};

function StatusIcon({ status }: { status: NonNullable<ChatMessage["status"]> }) {
  if (status === "sending") {
    return <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.75)" />;
  }
  if (status === "sent" || status === "delivered") {
    return <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.85)" />;
  }
  if (status === "seen") {
    return <Ionicons name="checkmark-done" size={14} color="#7dd3fc" />;
  }
  return null;
}

function BubbleChrome({
  children,
  isMine,
  onLongPress,
}: {
  children: ReactNode;
  isMine: boolean;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={380}
      className={[
        "max-w-[82%] rounded-2xl px-3 py-2 shadow-sm",
        isMine ? "rounded-br-md bg-zalo" : "rounded-bl-md bg-white dark:bg-slate-800",
      ].join(" ")}
    >
      {children}
    </Pressable>
  );
}

export const MessageBubble = memo(function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const showActions = useCallback(() => {
    const copy = async () => {
      if (message.kind === "text" && message.text) {
        await Clipboard.setStringAsync(message.text);
      }
    };
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Sao chép", "Hủy"], cancelButtonIndex: 1 },
        (i) => {
          if (i === 0) void copy();
        },
      );
    } else {
      Alert.alert("Tin nhắn", undefined, [
        { text: "Sao chép", onPress: () => void copy() },
        { text: "Hủy", style: "cancel" },
      ]);
    }
  }, [message.kind, message.text]);

  if (message.kind === "system") {
    return (
      <View className="mb-3 items-center px-4">
        <View className="rounded-full bg-black/10 px-3 py-1.5 dark:bg-white/15">
          <Text className="text-center text-xs text-slate-600 dark:text-slate-300">{message.text}</Text>
        </View>
      </View>
    );
  }

  if (message.kind === "image" && message.imageUrl) {
    return (
      <View className={`mb-2 flex-row ${isMine ? "justify-end" : "justify-start"}`}>
        <BubbleChrome isMine={isMine} onLongPress={showActions}>
          <Image
            source={{ uri: message.imageUrl }}
            className="h-40 w-56 max-w-full rounded-xl bg-slate-200"
            contentFit="cover"
          />
          <Text
            className={[
              "mt-1 text-right text-[11px]",
              isMine ? "text-white/80" : "text-slate-400",
            ].join(" ")}
          >
            {formatChatTime(message.createdAt)}
          </Text>
        </BubbleChrome>
      </View>
    );
  }

  return (
    <View className={`mb-2 flex-row ${isMine ? "justify-end" : "justify-start"}`}>
      <BubbleChrome isMine={isMine} onLongPress={showActions}>
        <Text
          className={[
            "text-[15px] leading-5",
            isMine ? "text-white" : "text-slate-900 dark:text-slate-100",
          ].join(" ")}
        >
          {message.text}
        </Text>
        <View className="mt-1 flex-row items-center justify-end gap-1">
          <Text
            className={[
              "text-[11px]",
              isMine ? "text-white/75" : "text-slate-400",
            ].join(" ")}
          >
            {formatChatTime(message.createdAt)}
          </Text>
          {isMine && message.status ? <StatusIcon status={message.status} /> : null}
        </View>
      </BubbleChrome>
    </View>
  );
});
