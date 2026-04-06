import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { GetUser } from './decorators/get-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ContactOtpDto, VerifyContactOtpDto } from './dto/contact-otp.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyLoginDeviceOtpDto } from './dto/verify-login-device-otp.dto';
import { LogoutBodyDto } from './dto/logout-body.dto';
import { RefreshBodyDto } from './dto/refresh-body.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/request-otp')
  @ApiOperation({ summary: 'Request OTP for registration (SMS/email dev-only)' })
  registerRequestOtp(
    @Body() dto: ContactOtpDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    return this.authService.registerRequestOtp(
      dto.phoneNumber,
      dto.email,
      this.clientIp(req),
      this.clientUa(req),
    );
  }

  @Post('register/verify-otp')
  @ApiOperation({ summary: 'Verify registration OTP; returns short-lived token for create-account' })
  registerVerifyOtp(@Body() dto: VerifyContactOtpDto): Promise<{ token: string }> {
    return this.authService.registerVerifyOtp(dto);
  }

  @Post('register/create-account')
  @ApiOperation({
    summary: 'Create password and account after registration OTP; opens session',
  })
  createAccount(@Body() dto: CreateAccountDto) {
    return this.authService.createAccount(dto);
  }

  @Post('login')
  @ApiOperation({
    summary:
      'Login with email or phone + password; trusted device returns tokens, new device returns verification challenge',
  })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(
      dto,
      this.clientIp(req),
      this.clientUa(req),
    );
  }

  @Post('login/verify-device-otp')
  @ApiOperation({
    summary:
      'Complete login on an untrusted device after OTP sent to account phone (preferred) or email',
  })
  verifyLoginDeviceOtp(@Body() dto: VerifyLoginDeviceOtpDto) {
    return this.authService.verifyLoginDeviceOtp(dto);
  }

  @Post('forgot-password/request-otp')
  @ApiOperation({ summary: 'Request OTP for password reset' })
  forgotPasswordRequestOtp(
    @Body() dto: ContactOtpDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    return this.authService.forgotPasswordRequestOtp(
      dto.phoneNumber,
      dto.email,
      this.clientIp(req),
      this.clientUa(req),
    );
  }

  @Post('forgot-password/verify-otp')
  @ApiOperation({ summary: 'Verify forgot-password OTP; returns reset token' })
  forgotPasswordVerifyOtp(
    @Body() dto: VerifyContactOtpDto,
  ): Promise<{ token: string }> {
    return this.authService.forgotPasswordVerifyOtp(dto);
  }

  @Post('forgot-password/reset')
  @ApiOperation({ summary: 'Set new password after forgot-password OTP' })
  forgotPasswordReset(@Body() dto: ForgotPasswordResetDto) {
    return this.authService.forgotPasswordReset(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and get new access token' })
  refresh(@Body() dto: RefreshBodyDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke current refresh token' })
  logout(@Body() dto: LogoutBodyDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke all refresh tokens for current user' })
  logoutAll(@GetUser('id') userId: string) {
    return this.authService.logoutAll(userId);
  }

  private clientIp(req: Request): string | undefined {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string') {
      return xff.split(',')[0]?.trim();
    }
    if (Array.isArray(xff)) {
      return xff[0];
    }
    return req.ip;
  }

  private clientUa(req: Request): string | undefined {
    const ua = req.headers['user-agent'];
    return typeof ua === 'string' ? ua : undefined;
  }
}
