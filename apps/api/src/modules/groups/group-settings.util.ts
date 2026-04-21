import type { Prisma } from '@prisma/client';

export type ParsedGroupSettings = {
  onlyAdminsCanPost: boolean;
  joinApprovalRequired: boolean;
  onlyAdminsCanAddMembers: boolean;
  onlyAdminsCanRemoveMembers: boolean;
  /** When true, owner/admin may recall others' messages (still cannot recall owner messages). */
  moderatorsCanRecallMessages: boolean;
};

export const DEFAULT_GROUP_SETTINGS: ParsedGroupSettings = {
  onlyAdminsCanPost: false,
  joinApprovalRequired: false,
  onlyAdminsCanAddMembers: true,
  onlyAdminsCanRemoveMembers: true,
  moderatorsCanRecallMessages: false,
};

export function parseGroupSettings(
  raw: Prisma.JsonValue | null | undefined,
): ParsedGroupSettings {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_GROUP_SETTINGS };
  }
  const o = raw as Record<string, unknown>;
  const bool = (k: string, def: boolean): boolean => {
    const v = o[k];
    return typeof v === 'boolean' ? v : def;
  };
  return {
    onlyAdminsCanPost: bool('onlyAdminsCanPost', DEFAULT_GROUP_SETTINGS.onlyAdminsCanPost),
    joinApprovalRequired: bool(
      'joinApprovalRequired',
      DEFAULT_GROUP_SETTINGS.joinApprovalRequired,
    ),
    onlyAdminsCanAddMembers: bool(
      'onlyAdminsCanAddMembers',
      DEFAULT_GROUP_SETTINGS.onlyAdminsCanAddMembers,
    ),
    onlyAdminsCanRemoveMembers: bool(
      'onlyAdminsCanRemoveMembers',
      DEFAULT_GROUP_SETTINGS.onlyAdminsCanRemoveMembers,
    ),
    moderatorsCanRecallMessages: bool(
      'moderatorsCanRecallMessages',
      DEFAULT_GROUP_SETTINGS.moderatorsCanRecallMessages,
    ),
  };
}

export function mergeGroupSettingsPatch(
  existing: Prisma.JsonValue | null | undefined,
  patch: Partial<ParsedGroupSettings>,
): Prisma.InputJsonValue {
  const cur = parseGroupSettings(existing);
  const next = { ...cur, ...patch };
  return next as unknown as Prisma.InputJsonValue;
}
