import { ApiProperty } from '@nestjs/swagger';

export class PresignedUploadPartDto {
  @ApiProperty()
  url!: string;

  @ApiProperty({ enum: ['PUT'] })
  method!: 'PUT';

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  headers!: Record<string, string>;
}

export class UploadInitResponseDto {
  @ApiProperty({ format: 'uuid' })
  uploadSessionId!: string;

  @ApiProperty()
  storageKey!: string;

  @ApiProperty()
  bucket!: string;

  @ApiProperty({ type: () => PresignedUploadPartDto })
  upload!: PresignedUploadPartDto;

  @ApiProperty()
  expiresAt!: Date;
}
