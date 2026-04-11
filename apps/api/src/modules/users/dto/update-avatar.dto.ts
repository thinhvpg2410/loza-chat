import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({
    description:
      'Completed image upload session id (POST /uploads/init then PUT file, then POST /uploads/:id/complete)',
  })
  @IsUUID('4')
  uploadSessionId!: string;
}
