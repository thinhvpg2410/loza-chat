import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from './common/swagger/http-error.dto';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health / welcome',
    description: 'Public endpoint; returns `text/plain`.',
  })
  @ApiOkResponse({
    description: 'Plain text greeting',
    schema: { type: 'string', example: 'Hello World!' },
  })
  @ApiResponse({
    status: 500,
    type: ApiErrorEnvelopeDto,
    description: 'Unexpected server error (JSON body)',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
