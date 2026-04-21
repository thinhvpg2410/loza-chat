import { ApiProperty } from '@nestjs/swagger';
import { ConversationMemberRole } from '@prisma/client';
import { IsIn } from 'class-validator';

export class UpdateGroupMemberRoleDto {
  @ApiProperty({ enum: ['admin', 'member'] })
  @IsIn([ConversationMemberRole.admin, ConversationMemberRole.member])
  role!: ConversationMemberRole;
}
