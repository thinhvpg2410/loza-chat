import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TransferGroupOwnershipDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  newOwnerUserId!: string;
}
