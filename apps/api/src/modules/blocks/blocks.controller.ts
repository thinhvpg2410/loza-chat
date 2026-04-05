import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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

  @Post()
  @ApiOperation({
    summary: 'Block a user (removes friendship and pending requests)',
  })
  async create(@GetUser('id') blockerId: string, @Body() dto: CreateBlockDto) {
    await this.blocksService.createBlock(blockerId, dto.blockedId);
    return { message: 'User blocked' };
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Unblock a user' })
  async remove(
    @GetUser('id') blockerId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) blockedId: string,
  ) {
    await this.blocksService.removeBlock(blockerId, blockedId);
    return { message: 'User unblocked' };
  }
}
