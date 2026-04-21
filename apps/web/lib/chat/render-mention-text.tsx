import { Fragment } from "react";

const MENTION_TOKEN_REGEX = /(^|\s)(@[a-zA-Z0-9._-]{1,64})/g;

type MentionTextPalette = {
  textClassName: string;
  mentionClassName: string;
};

export function renderMentionText(content: string, palette: MentionTextPalette) {
  const nodes: Array<string | JSX.Element> = [];
  let cursor = 0;
  let keyIndex = 0;
  for (const match of content.matchAll(MENTION_TOKEN_REGEX)) {
    const full = match[0] ?? "";
    const prefix = match[1] ?? "";
    const mention = match[2] ?? "";
    if (!full || !mention) {
      continue;
    }
    const start = match.index ?? -1;
    if (start < 0) {
      continue;
    }
    const mentionStart = start + prefix.length;
    if (mentionStart > cursor) {
      nodes.push(
        <Fragment key={`txt-${keyIndex++}`}>
          {content.slice(cursor, mentionStart)}
        </Fragment>,
      );
    }
    nodes.push(
      <span key={`mention-${keyIndex++}`} className={palette.mentionClassName}>
        {mention}
      </span>,
    );
    cursor = mentionStart + mention.length;
  }
  if (cursor < content.length) {
    nodes.push(
      <Fragment key={`txt-${keyIndex++}`}>
        {content.slice(cursor)}
      </Fragment>,
    );
  }
  if (nodes.length === 0) {
    return <span className={palette.textClassName}>{content}</span>;
  }
  return nodes;
}
