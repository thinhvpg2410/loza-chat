import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Safe subset used in friends, search, message senders, group roster. */
export class PublicUserProfileOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  username!: string | null;
}
