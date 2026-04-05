import { ApiProperty } from '@nestjs/swagger';
import type { User } from '@prisma/client';

export class UserPublicEntity {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiProperty({ nullable: true, description: 'Avatar URL' })
  avatar!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static fromUser(user: User): UserPublicEntity {
    const e = new UserPublicEntity();
    e.id = user.id;
    e.phone = user.phone;
    e.name = user.name;
    e.avatar = user.avatar;
    e.createdAt = user.createdAt;
    return e;
  }
}
