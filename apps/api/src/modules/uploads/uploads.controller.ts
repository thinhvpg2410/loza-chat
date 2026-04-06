import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadCompleteResponseDto } from './dto/upload-complete-response.dto';
import { UploadInitDto } from './dto/upload-init.dto';
import { UploadInitResponseDto } from './dto/upload-init-response.dto';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('init')
  @ApiOperation({
    summary:
      'Start direct-to-storage upload (presigned PUT). Bytes never pass through API.',
  })
  @ApiCreatedResponse({ type: UploadInitResponseDto })
  async init(
    @GetUser('id') userId: string,
    @Body() dto: UploadInitDto,
  ): Promise<UploadInitResponseDto> {
    return this.uploads.initSession(userId, dto);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary:
      'Finalize after client uploaded to storage; verifies object and creates Attachment',
  })
  @ApiOkResponse({ type: UploadCompleteResponseDto })
  async complete(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UploadCompleteResponseDto> {
    return this.uploads.completeSession(userId, id);
  }
}
