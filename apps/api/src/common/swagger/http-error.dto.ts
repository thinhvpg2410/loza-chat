import { ApiProperty } from '@nestjs/swagger';

/** Error body returned by {@link AllExceptionsFilter} for HTTP exceptions. */
export class ApiErrorBodyDto {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  code!: number;

  @ApiProperty({
    example: 'Bad Request',
    description: 'Single-line message (first item if validation failed)',
  })
  message!: string;
}

export class ApiErrorEnvelopeDto {
  @ApiProperty({ type: ApiErrorBodyDto })
  error!: ApiErrorBodyDto;
}
