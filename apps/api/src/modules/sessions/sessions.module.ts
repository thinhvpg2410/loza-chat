import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DevicesModule } from '../devices/devices.module';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [AuthModule, DevicesModule],
  controllers: [SessionsController],
})
export class SessionsModule {}
