import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SimpleMessageOpenApiDto } from '../../common/swagger/auth-openapi.dto';
import { ApiErrorEnvelopeDto } from '../../common/swagger/http-error.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';

@ApiTags('blocks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  @ApiOperation({ summary: 'List users you have blocked' })
  @ApiOkResponse({ description: 'Blocked users with profile and blockedAt' })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  async list(@GetUser('id') blockerId: string) {
    const blocks = await this.blocksService.listBlockedBy(blockerId);
    return { blocks };
  }

  @Post()
  @ApiOperation({
    summary: 'Block a user (removes friendship and pending requests)',
  })
  @ApiCreatedResponse({ type: SimpleMessageOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async create(@GetUser('id') blockerId: string, @Body() dto: CreateBlockDto) {
    await this.blocksService.createBlock(blockerId, dto.blockedId);
    return { message: 'User blocked' };
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiParam({ name: 'userId', format: 'uuid', description: 'User to unblock' })
  @ApiOkResponse({ type: SimpleMessageOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  async remove(
    @GetUser('id') blockerId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) blockedId: string,
  ) {
    await this.blocksService.removeBlock(blockerId, blockedId);
    return { message: 'User unblocked' };
  }
}
