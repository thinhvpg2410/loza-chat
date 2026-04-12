import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDeviceOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  deviceId!: string;

  @ApiProperty()
  platform!: string;

  @ApiProperty()
  appVersion!: string;

  @ApiPropertyOptional({ nullable: true })
  deviceName!: string | null;

  @ApiProperty()
  isTrusted!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  lastSeenAt!: Date;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class DevicesListOpenApiDto {
  @ApiProperty({ type: [UserDeviceOpenApiDto] })
  devices!: UserDeviceOpenApiDto[];
}
