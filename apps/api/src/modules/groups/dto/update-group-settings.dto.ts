import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateGroupSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  onlyAdminsCanPost?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  joinApprovalRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  onlyAdminsCanAddMembers?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  onlyAdminsCanRemoveMembers?: boolean;

  @ApiPropertyOptional({
    description:
      'When true, group owner and admins may recall messages sent by other members (never the owner’s messages).',
  })
  @IsOptional()
  @IsBoolean()
  moderatorsCanRecallMessages?: boolean;
}
