import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FriendRequestDto {
  @ApiProperty({ format: 'uuid', description: 'Target user id' })
  @IsUUID('4')
  userId!: string;
}
