import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '@prisma/client';
import { MediaKind, UploadSessionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { AppConfiguration } from '../../config/configuration';
import { publicMediaUrlForStorageKey } from '../../common/media/public-media-url';
import { toPublicUserProfile } from '../../common/types/public-user-profile';
import type { PublicUser } from '../../common/utils/user-public';
import { toPublicUser } from '../../common/utils/user-public';
import { normalizeEmail } from '../../common/utils/contact-identifiers';
import { PrismaService } from '../../prisma/prisma.service';
import { BlocksService } from '../blocks/blocks.service';
import { FriendsService } from '../friends/friends.service';
import { AuthErrorMessage } from '../auth/auth-errors';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import type { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { UpdateAvatarDto } from './dto/update-avatar.dto';
import type { UserSearchPublic } from './dto/user-search-result.dto';
import type { UserPublicProfileResponse } from './types/user-public-profile-view';

const PASSWORD_BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friends: FriendsService,
    private readonly blocks: BlocksService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  getMe(user: AuthenticatedUser): PublicUser {
    const { tokenDeviceId: _omit, ...rest } = user;
    return rest;
  }

  async isUsernameAvailable(
    username: string,
    viewerId: string,
  ): Promise<{ available: boolean }> {
    const taken = await this.prisma.user.findFirst({
      where: {
        username,
        NOT: { id: viewerId },
      },
    });
    return { available: !taken };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const hasField =
      dto.displayName !== undefined ||
      dto.avatarUrl !== undefined ||
      dto.statusMessage !== undefined ||
      dto.username !== undefined ||
      dto.birthDate !== undefined;
    if (!hasField) {
      throw new BadRequestException('Provide at least one field to update');
    }

    let username: string | null | undefined = dto.username;
    if (username === '') {
      username = null;
    }

    if (username !== undefined && username !== null) {
      const taken = await this.prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });
      if (taken) {
        throw new ConflictException('Username is already taken');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined
          ? { displayName: dto.displayName }
          : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.statusMessage !== undefined
          ? { statusMessage: dto.statusMessage }
          : {}),
        ...(username !== undefined ? { username } : {}),
        ...(dto.birthDate !== undefined
          ? {
              birthDate:
                dto.birthDate === null
                  ? null
                  : new Date(`${dto.birthDate}T12:00:00.000Z`),
            }
          : {}),
      },
    });
    return toPublicUser(user);
  }

  async updateAvatar(
    userId: string,
    dto: UpdateAvatarDto,
  ): Promise<{ user: PublicUser }> {
    const session = await this.prisma.uploadSession.findUnique({
      where: { id: dto.uploadSessionId },
    });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Upload session not found');
    }
    if (session.status !== UploadSessionStatus.uploaded) {
      throw new BadRequestException(
        'Upload session must be completed (POST /uploads/:id/complete)',
      );
    }
    if (session.uploadType !== MediaKind.image) {
      throw new BadRequestException('Avatar upload must use uploadType image');
    }
    if (!session.mimeType.toLowerCase().startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image MIME type');
    }

    const avatarUrl = publicMediaUrlForStorageKey(this.config, session.storageKey);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return { user: toPublicUser(user) };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      throw new BadRequestException(
        'Password is not set for this account; use forgot-password flow',
      );
    }
    const match = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException(AuthErrorMessage.INVALID_CREDENTIALS);
    }
    const newHash = await bcrypt.hash(dto.newPassword, PASSWORD_BCRYPT_ROUNDS);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.userDevice.updateMany({
        where: { userId },
        data: { isActive: false },
      }),
    ]);
    return { message: 'Password updated' };
  }

  async searchUsers(
    viewerId: string,
    phoneNumber?: string,
    email?: string,
    username?: string,
  ): Promise<{ results: UserSearchPublic[] }> {
    const n =
      (phoneNumber !== undefined && phoneNumber !== '' ? 1 : 0) +
      (email !== undefined && email !== '' ? 1 : 0) +
      (username !== undefined && username !== '' ? 1 : 0);
    if (n !== 1) {
      throw new BadRequestException(
        'Provide exactly one of phoneNumber, email, or username',
      );
    }

    let target: User | null = null;
    if (phoneNumber !== undefined && phoneNumber !== '') {
      target = await this.prisma.user.findUnique({
        where: { phoneNumber },
      });
    } else if (email !== undefined && email !== '') {
      target = await this.prisma.user.findUnique({
        where: { email: normalizeEmail(email) },
      });
    } else if (username !== undefined && username !== '') {
      target = await this.prisma.user.findUnique({
        where: { username },
      });
    }

    if (!target || !target.isActive) {
      return { results: [] };
    }

    const relationshipStatus = await this.friends.getRelationshipStatus(
      viewerId,
      target.id,
    );

    const row: UserSearchPublic = {
      id: target.id,
      displayName: target.displayName,
      avatarUrl: target.avatarUrl,
      username: target.username,
      statusMessage: target.statusMessage,
      relationshipStatus,
    };

    return { results: [row] };
  }

  async getPublicProfileForViewer(
    viewerId: string,
    targetUserId: string,
  ): Promise<UserPublicProfileResponse> {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target || !target.isActive) {
      throw new NotFoundException('User not found');
    }
    if (await this.blocks.isEitherBlocked(viewerId, targetUserId)) {
      throw new NotFoundException('User not found');
    }

    const relationshipStatus = await this.friends.getRelationshipStatus(
      viewerId,
      targetUserId,
    );

    return {
      profile: toPublicUserProfile(target),
      relationshipStatus,
    };
  }
}
