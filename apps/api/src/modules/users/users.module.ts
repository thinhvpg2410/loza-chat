import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BlocksModule } from '../blocks/blocks.module';
import { FriendsModule } from '../friends/friends.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule, FriendsModule, BlocksModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
