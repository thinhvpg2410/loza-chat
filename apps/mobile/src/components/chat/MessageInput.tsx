import {
  emitTypingStart,
  emitTypingStop,
} from "@/services/socket/socket";
import { useChatStore } from "@/store/chatStore";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  TextInput,
  View,
} from "react-native";

type MessageInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleTypingStop = useCallback(() => {
    const { activeConversationId, activePeerId } = useChatStore.getState();
    if (!activeConversationId || !activePeerId) return;
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = setTimeout(() => {
      emitTypingStop(activeConversationId, activePeerId);
    }, 1200);
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setText(value);
      const { activeConversationId, activePeerId } = useChatStore.getState();
      if (value.length > 0 && activeConversationId && activePeerId) {
        emitTypingStart(activeConversationId, activePeerId);
        scheduleTypingStop();
      } else if (value.length === 0 && activeConversationId && activePeerId) {
        emitTypingStop(activeConversationId, activePeerId);
      }
    },
    [scheduleTypingStop],
  );

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    const { activeConversationId, activePeerId } = useChatStore.getState();
    if (activeConversationId && activePeerId) {
      emitTypingStop(activeConversationId, activePeerId);
    }
    onSend(trimmed);
    setText("");
    Keyboard.dismiss();
  }, [disabled, onSend, text]);

  return (
    <View className="border-t border-slate-200 bg-white px-2 pb-2 pt-2 dark:border-slate-700 dark:bg-slate-950">
      <View className="flex-row items-end gap-1">
        <Pressable
          accessibilityLabel="Emoji"
          className="mb-1.5 h-10 w-10 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800"
          onPress={() => {}}
        >
          <Ionicons name="happy-outline" size={26} color="#64748b" />
        </Pressable>
        <View className="max-h-28 min-h-[40px] flex-1 justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-600 dark:bg-slate-900">
          <TextInput
            value={text}
            onChangeText={handleChange}
            placeholder="Tin nhắn"
            placeholderTextColor="#94a3b8"
            className="py-2.5 text-base text-slate-900 dark:text-slate-100"
            multiline
            maxLength={4000}
            editable={!disabled}
          />
        </View>
        <Pressable
          accessibilityLabel="Đính kèm"
          className="mb-1.5 h-10 w-10 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800"
          onPress={() => {}}
        >
          <Ionicons name="attach-outline" size={26} color="#64748b" />
        </Pressable>
        <Pressable
          accessibilityLabel="Gửi"
          disabled={disabled || !text.trim()}
          onPress={submit}
          className={[
            "mb-1.5 h-10 w-10 items-center justify-center rounded-full",
            disabled || !text.trim() ? "bg-slate-200 dark:bg-slate-800" : "bg-zalo",
          ].join(" ")}
        >
          <Ionicons name="send" size={18} color={disabled || !text.trim() ? "#94a3b8" : "#fff"} />
        </Pressable>
      </View>
    </View>
  );
}
