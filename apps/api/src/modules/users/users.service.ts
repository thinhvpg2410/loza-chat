import { BadRequestException, Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { apiOk } from '../../common/http/api-response.util';
import type { ApiResponse } from '../../common/http/api-response.util';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserPublicEntity } from './entities/user-public.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getMe(user: User): ApiResponse<UserPublicEntity> {
    return apiOk(UserPublicEntity.fromUser(user), 'Profile loaded');
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ApiResponse<UserPublicEntity>> {
    if (dto.name === undefined && dto.avatar === undefined) {
      throw new BadRequestException('Provide at least one of name or avatar');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}),
      },
    });

    return apiOk(UserPublicEntity.fromUser(updated), 'Profile updated');
  }

  async searchUsers(
    currentUserId: string,
    q: string,
  ): Promise<ApiResponse<UserPublicEntity[]>> {
    const term = q.trim();
    if (!term) {
      throw new BadRequestException('Query q cannot be empty');
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { phone: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return apiOk(
      users.map((u) => UserPublicEntity.fromUser(u)),
      'Search results',
    );
  }
}
