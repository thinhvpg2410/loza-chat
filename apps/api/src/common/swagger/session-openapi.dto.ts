import { ApiProperty } from '@nestjs/swagger';
import { UserDeviceOpenApiDto } from './device-openapi.dto';

export class UserSessionOpenApiDto extends UserDeviceOpenApiDto {
  @ApiProperty({
    description:
      'True when this row matches the client `deviceId` embedded in the current access token',
  })
  isCurrent!: boolean;
}

export class SessionsListOpenApiDto {
  @ApiProperty({ type: [UserSessionOpenApiDto] })
  sessions!: UserSessionOpenApiDto[];
}
