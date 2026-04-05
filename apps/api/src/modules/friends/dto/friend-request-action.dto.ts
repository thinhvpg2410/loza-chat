import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FriendRequestActionDto {
  @ApiProperty({ format: 'uuid', description: 'Friendship row id' })
  @IsUUID('4')
  requestId!: string;
}
