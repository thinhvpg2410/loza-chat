import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
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
  mentionCandidates?: { userId: string; displayName: string; username: string | null }[];
  onToggleVoiceRecording?: () => void;
  isVoiceRecording?: boolean;
  voiceRecordingDurationSec?: number;
  onCancelVoiceRecording?: () => void;
};

type ActiveMentionQuery = {
  start: number;
  end: number;
  query: string;
};

function extractActiveMentionQuery(text: string, caret: number): ActiveMentionQuery | null {
  if (caret < 0 || caret > text.length) return null;
  const left = text.slice(0, caret);
  const atPos = left.lastIndexOf("@");
  if (atPos < 0) return null;
  if (atPos > 0) {
    const prev = left[atPos - 1];
    if (!/\s/.test(prev)) return null;
  }
  const token = left.slice(atPos + 1);
  if (/\s/.test(token)) return null;
  return { start: atPos, end: caret, query: token.trim().toLowerCase() };
}

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
  mentionCandidates = [],
  onToggleVoiceRecording,
  isVoiceRecording = false,
  voiceRecordingDurationSec = 0,
  onCancelVoiceRecording,
}: MessageInputBarProps) {
  const [inputHeight, setInputHeight] = useState(MIN_INPUT);
  const [caretIndex, setCaretIndex] = useState(value.length);
  const trimmed = value.trim();
  const canSend = !disabled && trimmed.length > 0;
  const mentionQuery = extractActiveMentionQuery(value, caretIndex);
  const mentionItems = mentionQuery
    ? [
        ...(("@all".includes(`@${mentionQuery.query}`) || mentionQuery.query.length === 0)
          ? [{ id: "__all__", label: "Tất cả thành viên", token: "all" }]
          : []),
        ...mentionCandidates
          .filter((m) => {
            const q = mentionQuery.query;
            if (!q) return true;
            return (
              m.displayName.toLowerCase().includes(q) ||
              (m.username ?? "").toLowerCase().includes(q)
            );
          })
          .slice(0, 8)
          .map((m) => ({
            id: m.userId,
            label: m.displayName,
            token:
              m.username?.trim().toLowerCase() ||
              m.displayName
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, ""),
          })),
      ]
    : [];
  const mm = String(Math.floor(voiceRecordingDurationSec / 60)).padStart(2, "0");
  const ss = String(voiceRecordingDurationSec % 60).padStart(2, "0");

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
    if (isVoiceRecording) {
      onToggleVoiceRecording?.();
      return;
    }
    if (!canSend) return;
    onSend();
    setInputHeight(MIN_INPUT);
    Keyboard.dismiss();
  }, [canSend, isVoiceRecording, onSend, onToggleVoiceRecording]);

  const onSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setCaretIndex(e.nativeEvent.selection.start);
    },
    [],
  );

  const applyMention = useCallback(
    (token: string) => {
      if (!mentionQuery) return;
      const prefix = value.slice(0, mentionQuery.start);
      const suffix = value.slice(mentionQuery.end);
      const inserted = `@${token} `;
      onChangeText(`${prefix}${inserted}${suffix}`);
      setCaretIndex(prefix.length + inserted.length);
    },
    [mentionQuery, onChangeText, value],
  );

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
          {isVoiceRecording ? (
            <View style={styles.recordingInline}>
              <View style={styles.recordBadge}>
                <Text style={styles.recordBadgeText}>{`REC ${mm}:${ss}`}</Text>
              </View>
              <View style={styles.waveWrap}>
                <View style={[styles.waveBar, { height: 8 }]} />
                <View style={[styles.waveBar, { height: 12 }]} />
                <View style={[styles.waveBar, { height: 16 }]} />
                <View style={[styles.waveBar, { height: 12 }]} />
                <View style={[styles.waveBar, { height: 8 }]} />
              </View>
              <Text style={styles.recordingText}>Đang ghi âm...</Text>
            </View>
          ) : (
            <TextInput
              value={value}
              onChangeText={onChangeText}
              onSelectionChange={onSelectionChange}
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
          )}
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
          disabled={!canSend && !isVoiceRecording}
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
        {!trimmed.length && onToggleVoiceRecording ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isVoiceRecording ? "Dừng ghi âm" : "Ghi âm"}
            hitSlop={8}
            disabled={disabled}
            onPress={onToggleVoiceRecording}
            style={({ pressed }) => [
              styles.sendBtn,
              isVoiceRecording ? styles.micRecordingBtn : styles.micIdleBtn,
              pressed && styles.sendPressed,
              disabled && styles.sendDisabled,
            ]}
          >
            <Ionicons name="mic" size={15} color={colors.textInverse} />
          </Pressable>
        ) : null}
        {isVoiceRecording && onCancelVoiceRecording ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hủy ghi âm"
            hitSlop={8}
            disabled={disabled}
            onPress={onCancelVoiceRecording}
            style={({ pressed }) => [styles.cancelRecBtn, pressed && styles.iconPressed, disabled && styles.iconDisabled]}
          >
            <Text style={styles.cancelRecText}>Hủy</Text>
          </Pressable>
        ) : null}
      </View>
      {mentionItems.length > 0 ? (
        <View style={styles.mentionDropdown}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {mentionItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => applyMention(item.token)}
                style={({ pressed }) => [styles.mentionRow, pressed && styles.mentionRowPressed]}
              >
                <Text style={styles.mentionLabel}>{item.label}</Text>
                <Text style={styles.mentionToken}>@{item.token}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
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
  micIdleBtn: {
    backgroundColor: colors.primary,
  },
  micRecordingBtn: {
    backgroundColor: "#ef4444",
  },
  mentionDropdown: {
    marginHorizontal: 40,
    marginBottom: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.chatBubbleIncomingBorder,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    maxHeight: 190,
  },
  mentionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mentionRowPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  mentionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
  },
  mentionToken: {
    color: colors.textMuted,
    fontSize: 11,
  },
  recordingInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  recordBadge: {
    borderRadius: 999,
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recordBadgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: "700",
  },
  waveWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  recordingText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  cancelRecBtn: {
    height: SEND_DIM,
    borderRadius: SEND_DIM / 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceSecondary,
  },
  cancelRecText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
});
