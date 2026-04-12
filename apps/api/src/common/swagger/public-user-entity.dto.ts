import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** User row as returned by the API (password hash is never exposed). */
export class PublicUserEntityDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phoneNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  username!: string | null;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  statusMessage!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  birthDate!: Date | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class MeResponseOpenApiDto {
  @ApiProperty({ type: PublicUserEntityDto })
  user!: PublicUserEntityDto;
}

export class UserPatchResponseOpenApiDto {
  @ApiProperty({ type: PublicUserEntityDto })
  user!: PublicUserEntityDto;
}
