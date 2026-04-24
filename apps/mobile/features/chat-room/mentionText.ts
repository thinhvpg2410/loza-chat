const MENTION_TOKEN_REGEX = /(^|\s)(@[a-zA-Z0-9._-]{1,64})/g;

export type MentionTextPart = {
  text: string;
  isMention: boolean;
};

export function splitMentionTextParts(content: string): MentionTextPart[] {
  const parts: MentionTextPart[] = [];
  let cursor = 0;
  for (const match of content.matchAll(MENTION_TOKEN_REGEX)) {
    const full = match[0] ?? "";
    const prefix = match[1] ?? "";
    const mention = match[2] ?? "";
    const start = match.index ?? -1;
    if (!full || !mention || start < 0) {
      continue;
    }
    const mentionStart = start + prefix.length;
    if (mentionStart > cursor) {
      parts.push({ text: content.slice(cursor, mentionStart), isMention: false });
    }
    parts.push({ text: mention, isMention: true });
    cursor = mentionStart + mention.length;
  }
  if (cursor < content.length) {
    parts.push({ text: content.slice(cursor), isMention: false });
  }
  return parts.length > 0 ? parts : [{ text: content, isMention: false }];
}
