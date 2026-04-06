import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  ConversationMemberRole,
  ConversationType,
} from '@prisma/client';

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

  /** Owner and admin can rename the group and add members. */
  assertCanManageGroupContent(actorRole: ConversationMemberRole | null): void {
    const r = this.normalizeRole(actorRole);
    if (r !== ConversationMemberRole.owner && r !== ConversationMemberRole.admin) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  assertCanEditAvatar(actorRole: ConversationMemberRole | null): void {
    if (this.normalizeRole(actorRole) !== ConversationMemberRole.owner) {
      throw new ForbiddenException('Only the group owner can change the avatar');
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
}
