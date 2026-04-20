import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from "react-native";

import type { ReplyReference } from "@features/chat-room/types";
import { colors, radius, spacing } from "@theme";

import { ReplyPreviewBanner } from "./ReplyPreview";

/** Single-line composer height — Zalo-like compact row */
const MIN_INPUT = 28;
const MAX_INPUT = 84;
const ICON_GLYPH = 20;
const ICON_ROW = 32;
const SEND_DIM = 28;

type MessageInputBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  /** Safe area bottom inset (home indicator) */
  bottomInset: number;
  /** When true, composer is read-only and send is disabled. */
  disabled?: boolean;
  placeholder?: string;
  replyingTo?: ReplyReference | null;
  onCancelReply?: () => void;
  onOpenAttachment?: () => void;
  onOpenEmoji?: () => void;
};

export function MessageInputBar({
  value,
  onChangeText,
  onSend,
  bottomInset,
  disabled = false,
  placeholder = "Tin nhắn",
  replyingTo,
  onCancelReply,
  onOpenAttachment,
  onOpenEmoji,
}: MessageInputBarProps) {
  const [inputHeight, setInputHeight] = useState(MIN_INPUT);
  const trimmed = value.trim();
  const canSend = !disabled && trimmed.length > 0;

  useEffect(() => {
    if (!value) setInputHeight(MIN_INPUT);
  }, [value]);

  const onContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const h = e.nativeEvent.contentSize.height;
      const next = Math.min(MAX_INPUT, Math.max(MIN_INPUT, Math.ceil(h)));
      setInputHeight(next);
    },
    [],
  );

  const send = useCallback(() => {
    if (!canSend) return;
    onSend();
    setInputHeight(MIN_INPUT);
    Keyboard.dismiss();
  }, [canSend, onSend]);

  return (
    <View style={[styles.bar, { paddingBottom: bottomInset + 5 }]}>
      {replyingTo && onCancelReply ? <ReplyPreviewBanner reply={replyingTo} onClose={onCancelReply} /> : null}
      <View style={styles.inner}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Emoji"
          hitSlop={8}
          disabled={disabled}
          onPress={() => onOpenEmoji?.()}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed, disabled && styles.iconDisabled]}
        >
          <Ionicons name="happy-outline" size={ICON_GLYPH} color={colors.textMuted} />
        </Pressable>

        <View style={[styles.field, { minHeight: Math.max(inputHeight, MIN_INPUT) }]}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            editable={!disabled}
            placeholder={placeholder}
            placeholderTextColor={colors.textPlaceholder}
            multiline
            scrollEnabled={inputHeight >= MAX_INPUT - 6}
            onContentSizeChange={onContentSizeChange}
            style={styles.input}
            maxLength={4000}
            textAlignVertical="top"
            keyboardAppearance="default"
            returnKeyType="default"
            blurOnSubmit={false}
            {...(Platform.OS === "android" ? { includeFontPadding: false } : {})}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đính kèm"
          hitSlop={8}
          disabled={disabled}
          onPress={() => onOpenAttachment?.()}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed, disabled && styles.iconDisabled]}
        >
          <Ionicons name="add" size={ICON_GLYPH + 2} color={colors.textMuted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Gửi"
          hitSlop={8}
          disabled={!canSend}
          onPress={send}
          style={({ pressed }) => [
            styles.sendBtn,
            !canSend && styles.sendDisabled,
            canSend && pressed && styles.sendPressed,
          ]}
        >
          <Ionicons
            name="send"
            size={15}
            color={canSend ? colors.textInverse : colors.textPlaceholder}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.chatBubbleIncomingBorder,
    backgroundColor: colors.background,
  },
  inner: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingTop: 5,
    paddingBottom: 5,
    gap: 3,
  },
  iconBtn: {
    width: ICON_ROW,
    height: ICON_ROW,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  iconPressed: {
    opacity: 0.65,
  },
  iconDisabled: {
    opacity: 0.35,
  },
  field: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.chatBubbleIncomingBorder,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === "ios" ? 5 : 4,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    paddingVertical: 0,
    margin: 0,
    maxHeight: MAX_INPUT,
  },
  sendBtn: {
    width: SEND_DIM,
    height: SEND_DIM,
    borderRadius: SEND_DIM / 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  sendPressed: {
    backgroundColor: colors.primaryPressed,
  },
});
