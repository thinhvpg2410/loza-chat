import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  ConversationMemberRole,
  ConversationType,
} from '@prisma/client';
import type { ParsedGroupSettings } from './group-settings.util';

@Injectable()
export class GroupPermissionsService {
  normalizeRole(role: ConversationMemberRole | null): ConversationMemberRole {
    return role ?? ConversationMemberRole.member;
  }

  assertGroupConversation(type: ConversationType): void {
    if (type !== ConversationType.group) {
      throw new ForbiddenException('Not a group conversation');
    }
  }

  assertCanManageGroupContent(actorRole: ConversationMemberRole | null): void {
    const r = this.normalizeRole(actorRole);
    if (r !== ConversationMemberRole.owner && r !== ConversationMemberRole.admin) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  assertCanUpdateGroupSettings(actorRole: ConversationMemberRole | null): void {
    const r = this.normalizeRole(actorRole);
    if (r !== ConversationMemberRole.owner && r !== ConversationMemberRole.admin) {
      throw new ForbiddenException('Only the group owner or admins can change group settings');
    }
  }

  assertMayPostGroupMessage(
    actorRole: ConversationMemberRole | null,
    settings: ParsedGroupSettings,
  ): void {
    if (!settings.onlyAdminsCanPost) {
      return;
    }
    const r = this.normalizeRole(actorRole);
    if (r === ConversationMemberRole.owner || r === ConversationMemberRole.admin) {
      return;
    }
    throw new ForbiddenException('Only group owners and admins can send messages');
  }

  assertMayAddMembers(
    actorRole: ConversationMemberRole | null,
    settings: ParsedGroupSettings,
  ): void {
    const r = this.normalizeRole(actorRole);
    if (settings.onlyAdminsCanAddMembers) {
      this.assertCanManageGroupContent(r);
    }
  }

  assertMayRemoveMembers(
    actorRole: ConversationMemberRole | null,
    settings: ParsedGroupSettings,
  ): void {
    const r = this.normalizeRole(actorRole);
    if (settings.onlyAdminsCanRemoveMembers) {
      this.assertCanManageGroupContent(r);
    }
  }

  assertCanEditAvatar(actorRole: ConversationMemberRole | null): void {
    const r = this.normalizeRole(actorRole);
    if (r !== ConversationMemberRole.owner && r !== ConversationMemberRole.admin) {
      throw new ForbiddenException('Only the group owner or admins can change the avatar');
    }
  }

  /**
   * Remove rules: owner may remove admins and members. Admin may remove members only.
   * The owner row cannot be removed via this API (use leave + ownership transfer).
   */
  assertActorCanRemoveMember(
    actorRole: ConversationMemberRole | null,
    targetRole: ConversationMemberRole | null,
  ): void {
    const actor = this.normalizeRole(actorRole);
    const target = this.normalizeRole(targetRole);

    if (target === ConversationMemberRole.owner) {
      throw new ForbiddenException('The group owner cannot be removed');
    }
    if (actor === ConversationMemberRole.member) {
      throw new ForbiddenException('Insufficient permissions');
    }
    if (
      actor === ConversationMemberRole.admin &&
      target === ConversationMemberRole.admin
    ) {
      throw new ForbiddenException('Admins cannot remove other admins');
    }
  }

  assertOwnerMayAssignRoles(actorRole: ConversationMemberRole | null): void {
    if (this.normalizeRole(actorRole) !== ConversationMemberRole.owner) {
      throw new ForbiddenException('Only the group owner can change member roles');
    }
  }
}
