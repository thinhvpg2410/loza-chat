import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { DeviceSessionDto } from './device-session.dto';

export class LoginDto extends DeviceSessionDto {
  @ApiProperty({
    description: 'Email or E.164 phone number',
    example: 'user@example.com',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(320)
  identifier!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
