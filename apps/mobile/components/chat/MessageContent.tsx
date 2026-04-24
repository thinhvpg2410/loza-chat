import { memo } from "react";

import type { ChatRoomMessage, MessageSenderRole } from "@features/chat-room/types";

import { FileMessage } from "./FileMessage";
import { ImageMessage } from "./ImageMessage";
import { MessageBubble, type BubblePosition } from "./MessageBubble";
import { StickerMessage } from "./StickerMessage";

export type MessageContentProps = {
  message: ChatRoomMessage;
  role: MessageSenderRole;
  position: BubblePosition;
  onPress: () => void;
  onLongPress: () => void;
  onImagePress: (uri: string) => void;
  onSwipeReply?: () => void;
  autoLoadMedia?: boolean;
};

function UnpackedMessageContent({
  message,
  role,
  position,
  onPress,
  onLongPress,
  onImagePress,
  onSwipeReply,
  autoLoadMedia = true,
}: MessageContentProps) {
  switch (message.kind) {
    case "text":
      return (
        <MessageBubble
          role={role}
          position={position}
          text={message.body ?? ""}
          replyTo={message.replyTo}
          onPress={onPress}
          onLongPress={onLongPress}
          onSwipeReply={onSwipeReply}
        />
      );
    case "image":
      return (
        <ImageMessage
          role={role}
          position={position}
          imageUrl={message.imageUrl ?? ""}
          imageWidth={message.imageWidth}
          imageHeight={message.imageHeight}
          replyTo={message.replyTo}
          onPress={() => message.imageUrl && onImagePress(message.imageUrl)}
          onLongPress={onLongPress}
          autoLoad={autoLoadMedia}
        />
      );
    case "file":
      return message.file ? (
        <FileMessage
          role={role}
          position={position}
          name={message.file.name}
          sizeBytes={message.file.sizeBytes}
          mime={message.file.mime}
          fileUrl={message.file.url}
          replyTo={message.replyTo}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      ) : null;
    case "sticker":
      return (
        <StickerMessage
          role={role}
          stickerUrl={message.stickerUrl}
          stickerEmoji={message.stickerEmoji}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      );
    case "groupEvent":
      return null;
    default:
      return null;
  }
}

export const MessageContent = memo(UnpackedMessageContent);
