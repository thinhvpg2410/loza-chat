import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FriendsService } from '../friends/friends.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { UserSearchPublic } from './dto/user-search-result.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friends: FriendsService,
  ) {}

  getMe(user: User): User {
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const hasField =
      dto.displayName !== undefined ||
      dto.avatarUrl !== undefined ||
      dto.statusMessage !== undefined ||
      dto.username !== undefined;
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

    return this.prisma.user.update({
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
      },
    });
  }

  async searchUsers(
    viewerId: string,
    phoneNumber?: string,
    username?: string,
  ): Promise<{ results: UserSearchPublic[] }> {
    const n =
      (phoneNumber !== undefined && phoneNumber !== '' ? 1 : 0) +
      (username !== undefined && username !== '' ? 1 : 0);
    if (n !== 1) {
      throw new BadRequestException(
        'Provide exactly one of phoneNumber or username',
      );
    }

    let target: User | null = null;
    if (phoneNumber !== undefined && phoneNumber !== '') {
      target = await this.prisma.user.findUnique({
        where: { phoneNumber },
      });
    } else if (username !== undefined && username !== '') {
      target = await this.prisma.user.findUnique({
        where: { username },
      });
    }

    if (!target) {
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
      relationshipStatus,
    };

    return { results: [row] };
  }
}
