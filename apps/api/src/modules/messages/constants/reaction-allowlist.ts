/**
 * Allowed message reactions (emoji strings). Extend or replace with config-driven rules later.
 */
export const ALLOWED_MESSAGE_REACTIONS: readonly string[] = [
  '👍',
  '❤️',
  '😂',
  '😮',
  '😢',
  '🙏',
] as const;

const allowedSet = new Set<string>(ALLOWED_MESSAGE_REACTIONS);

export function isAllowedReaction(reaction: string): boolean {
  return allowedSet.has(reaction);
}
