import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateBlockDto {
  @ApiProperty({ format: 'uuid', description: 'User id to block' })
  @IsUUID('4')
  blockedId!: string;
}
