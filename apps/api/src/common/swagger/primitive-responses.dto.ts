import { ApiProperty } from '@nestjs/swagger';

export class OkTrueOpenApiDto {
  @ApiProperty({ example: true })
  ok!: true;
}

export class GroupLeaveOpenApiDto {
  @ApiProperty({ example: true })
  left!: true;
}
