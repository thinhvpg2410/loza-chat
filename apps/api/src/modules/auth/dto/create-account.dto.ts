import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/strong-password.decorator';
import { DeviceSessionDto } from './device-session.dto';

export class CreateAccountDto extends DeviceSessionDto {
  @ApiProperty({
    description: 'JWT from POST /auth/register/verify-otp',
  })
  @IsString()
  @MinLength(20)
  token!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  @IsStrongPassword()
  password!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  displayName?: string;
}
