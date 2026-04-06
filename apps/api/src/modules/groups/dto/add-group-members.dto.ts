import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsUUID,
} from 'class-validator';

const MAX_ADD_BATCH = 50;

export class AddGroupMembersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ADD_BATCH)
  @IsUUID('4', { each: true })
  memberIds!: string[];
}
