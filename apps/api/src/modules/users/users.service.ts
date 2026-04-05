import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
}
