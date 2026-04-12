import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SessionsListOpenApiDto } from '../../common/swagger/session-openapi.dto';
import { ApiErrorEnvelopeDto } from '../../common/swagger/http-error.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { DevicesService } from '../devices/devices.service';

@ApiTags('sessions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  @ApiOperation({
    summary: 'List active sessions (devices) for the current user',
    description:
      'Each row is a trusted device record with a valid session context. `isCurrent` matches the JWT device id when present.',
  })
  @ApiOkResponse({ type: SessionsListOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  async list(@GetUser() user: AuthenticatedUser) {
    const sessions = await this.devices.listSessionsForUser(
      user.id,
      user.tokenDeviceId,
    );
    return { sessions };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoke a session: invalidate refresh tokens for that device',
    description:
      'Marks the device inactive and revokes its refresh tokens. The current access token may remain valid until it expires.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UserDevice row id' })
  @ApiNoContentResponse({ description: 'Session revoked' })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async revoke(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) sessionId: string,
  ): Promise<void> {
    await this.devices.revokeSession(userId, sessionId);
  }
}
