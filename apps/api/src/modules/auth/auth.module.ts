import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { SignOptions } from 'jsonwebtoken';
import { DevicesModule } from '../devices/devices.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { OtpRequestsService } from './otp-requests.service';
import { TokenService } from './token.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: cfg.getOrThrow<string>(
            'jwt.accessExpiresIn',
          ) as SignOptions['expiresIn'],
        },
      }),
    }),
    forwardRef(() => DevicesModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpRequestsService,
    TokenService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
