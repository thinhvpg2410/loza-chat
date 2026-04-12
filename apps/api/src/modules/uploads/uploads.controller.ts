import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  type RawBodyRequest,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ApiErrorEnvelopeDto } from '../../common/swagger/http-error.dto';
import { OkTrueOpenApiDto } from '../../common/swagger/primitive-responses.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadCompleteResponseDto } from './dto/upload-complete-response.dto';
import { UploadInitDto } from './dto/upload-init.dto';
import { UploadInitResponseDto } from './dto/upload-init-response.dto';
import { UploadsService } from './uploads.service';

function readStreamToBuffer(req: Request): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('init')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Start direct-to-storage upload (presigned PUT). Bytes never pass through API.',
  })
  @ApiCreatedResponse({ type: UploadInitResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  async init(
    @GetUser('id') userId: string,
    @Body() dto: UploadInitDto,
  ): Promise<UploadInitResponseDto> {
    return this.uploads.initSession(userId, dto);
  }

  @Put('mock-upload/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'STORAGE_MOCK only: upload bytes to the API (replace fake S3 presigned host).',
  })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiBody({
    description: 'Raw file bytes (request body)',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiOkResponse({ type: OkTrueOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  async mockUploadPut(
    @Req() req: RawBodyRequest<Request>,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @GetUser('id') userId: string,
  ): Promise<{ ok: true }> {
    const raw = req.rawBody;
    let buf: Buffer | undefined =
      raw instanceof Buffer
        ? raw
        : raw instanceof Uint8Array
          ? Buffer.from(raw)
          : undefined;
    if (!buf?.length) {
      buf = await readStreamToBuffer(req);
    }
    if (!buf.length) {
      throw new BadRequestException('Empty body');
    }
    await this.uploads.receiveMockUpload(userId, sessionId, buf);
    return { ok: true };
  }

  @Get('mock-public')
  @ApiOperation({
    summary:
      'STORAGE_MOCK only: fetch uploaded bytes (no auth). For avatar URLs in dev.',
  })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({
    description: 'Binary object body; Content-Type reflects stored MIME type',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiResponse({ status: 404, description: 'Missing key or object not found' })
  async mockPublicGet(
    @Query('key') key: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    if (!key?.trim()) {
      throw new NotFoundException();
    }
    const decoded = decodeURIComponent(key);
    const out = await this.uploads.getMockPublicObject(decoded);
    if (!out) {
      throw new NotFoundException();
    }
    res.setHeader('Content-Type', out.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(out.buffer);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Finalize after client uploaded to storage; verifies object and creates Attachment',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Upload session id' })
  @ApiOkResponse({ type: UploadCompleteResponseDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async complete(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UploadCompleteResponseDto> {
    return this.uploads.completeSession(userId, id);
  }
}
