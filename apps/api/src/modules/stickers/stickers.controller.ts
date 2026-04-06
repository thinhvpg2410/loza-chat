import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecentStickersQueryDto } from './dto/recent-stickers-query.dto';
import { StickersService } from './stickers.service';

@ApiTags('stickers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('stickers')
export class StickersController {
  constructor(private readonly stickersService: StickersService) {}

  @Get('packs')
  @ApiOperation({ summary: 'List active sticker packs (with sticker counts)' })
  async listPacks() {
    return this.stickersService.listActivePacks();
  }

  @Get('packs/:id')
  @ApiOperation({ summary: 'Sticker pack details and active stickers' })
  async getPack(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.stickersService.getActivePackById(id);
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Your recently used stickers (lastUsedAt desc)',
  })
  async recent(
    @GetUser('id') userId: string,
    @Query() query: RecentStickersQueryDto,
  ) {
    return this.stickersService.listRecentForUser(userId, query);
  }
}
