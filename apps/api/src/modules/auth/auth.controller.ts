import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  AuthSessionOpenApiDto,
  LoginDeviceChallengeOpenApiDto,
  LoginSuccessOpenApiDto,
  QrCreateOpenApiDto,
  QrStatusApprovedDeliveredOpenApiDto,
  QrStatusApprovedWithSessionOpenApiDto,
  QrStatusPendingOpenApiDto,
  QrStatusTerminalOpenApiDto,
  RefreshTokensOpenApiDto,
  SimpleMessageOpenApiDto,
  TokenOnlyOpenApiDto,
} from '../../common/swagger/auth-openapi.dto';
import { ApiErrorEnvelopeDto } from '../../common/swagger/http-error.dto';
import { OkTrueOpenApiDto } from '../../common/swagger/primitive-responses.dto';
import { GetUser } from './decorators/get-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ContactOtpDto, VerifyContactOtpDto } from './dto/contact-otp.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';
import { LoginDto } from './dto/login.dto';
import { QrCreateDto } from './dto/qr-create.dto';
import { QrSessionTokenDto } from './dto/qr-session-token.dto';
import { VerifyLoginDeviceOtpDto } from './dto/verify-login-device-otp.dto';
import { LogoutBodyDto } from './dto/logout-body.dto';
import { RefreshBodyDto } from './dto/refresh-body.dto';

const loginResultSchema = {
  oneOf: [
    { $ref: getSchemaPath(LoginSuccessOpenApiDto) },
    { $ref: getSchemaPath(LoginDeviceChallengeOpenApiDto) },
  ],
};

const qrStatusSchema = {
  oneOf: [
    { $ref: getSchemaPath(QrStatusPendingOpenApiDto) },
    { $ref: getSchemaPath(QrStatusTerminalOpenApiDto) },
    { $ref: getSchemaPath(QrStatusApprovedDeliveredOpenApiDto) },
    { $ref: getSchemaPath(QrStatusApprovedWithSessionOpenApiDto) },
  ],
};

@ApiTags('auth')
@ApiExtraModels(
  SimpleMessageOpenApiDto,
  TokenOnlyOpenApiDto,
  AuthSessionOpenApiDto,
  LoginSuccessOpenApiDto,
  LoginDeviceChallengeOpenApiDto,
  RefreshTokensOpenApiDto,
  QrCreateOpenApiDto,
  QrStatusPendingOpenApiDto,
  QrStatusTerminalOpenApiDto,
  QrStatusApprovedDeliveredOpenApiDto,
  QrStatusApprovedWithSessionOpenApiDto,
  OkTrueOpenApiDto,
)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/request-otp')
  @ApiOperation({
    summary: 'Request OTP for registration (SMS/email dev-only)',
    description:
      'Sends a one-time code. In development, delivery may be logged instead of SMS/email. Re-requests for the same contact while a code is active rotate the code subject to rate limits, max resends, and `OTP_RESEND_COOLDOWN_SECONDS` between sends.',
  })
  @ApiCreatedResponse({ type: SimpleMessageOpenApiDto })
  @ApiResponse({ status: 409, type: ApiErrorEnvelopeDto })
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
  @ApiOperation({
    summary:
      'Verify registration OTP; returns short-lived token for create-account',
  })
  @ApiCreatedResponse({ type: TokenOnlyOpenApiDto })
  @ApiResponse({ status: 409, type: ApiErrorEnvelopeDto })
  registerVerifyOtp(
    @Body() dto: VerifyContactOtpDto,
  ): Promise<{ token: string }> {
    return this.authService.registerVerifyOtp(dto);
  }

  @Post('register/create-account')
  @ApiOperation({
    summary:
      'Create password and account after registration OTP; opens session',
  })
  @ApiCreatedResponse({ type: AuthSessionOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  createAccount(@Body() dto: CreateAccountDto) {
    return this.authService.createAccount(dto);
  }

  @Post('login')
  @ApiOperation({
    summary:
      'Login with email or phone + password; trusted device returns tokens, new device returns verification challenge',
    description:
      'When a device OTP is issued, repeat logins for the same account/contact reuse the same OTP row and are subject to resend limits and cooldown.',
  })
  @ApiCreatedResponse({
    description: 'Either a full session or a device verification challenge',
    schema: loginResultSchema,
  })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.clientIp(req), this.clientUa(req));
  }

  @Post('login/verify-device-otp')
  @ApiOperation({
    summary:
      'Complete login on an untrusted device after OTP sent to account phone (preferred) or email',
  })
  @ApiCreatedResponse({
    description: 'Session after successful OTP verification',
    type: LoginSuccessOpenApiDto,
  })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  verifyLoginDeviceOtp(@Body() dto: VerifyLoginDeviceOtpDto) {
    return this.authService.verifyLoginDeviceOtp(dto);
  }

  @Post('qr/create')
  @ApiOperation({
    summary:
      'Create a short-lived QR login session (web). Put sessionToken in QR for mobile to scan.',
  })
  @ApiCreatedResponse({ type: QrCreateOpenApiDto })
  qrCreate(@Body() dto: QrCreateDto) {
    return this.authService.qrCreate(dto);
  }

  @Get('qr/status/:sessionToken')
  @ApiOperation({
    summary:
      'Poll QR login status; when approved, first poll returns access/refresh (one-time)',
    description:
      'Use the same `sessionToken` as in the QR payload (64 hex chars). After `approved` with tokens, later polls return `tokensAlreadyDelivered: true`.',
  })
  @ApiParam({
    name: 'sessionToken',
    description: 'Opaque token from POST /auth/qr/create',
    example: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
  })
  @ApiOkResponse({
    description: 'Union of lifecycle states and optional session payload',
    schema: qrStatusSchema,
  })
  @ApiResponse({ status: 410, type: ApiErrorEnvelopeDto })
  qrStatus(@Param('sessionToken') sessionToken: string) {
    return this.authService.qrGetStatus(sessionToken);
  }

  @Post('qr/scan')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Authenticated mobile: record scan of web QR session',
  })
  @ApiCreatedResponse({ type: OkTrueOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 410, type: ApiErrorEnvelopeDto })
  qrScan(@GetUser('id') userId: string, @Body() dto: QrSessionTokenDto) {
    return this.authService.qrScan(userId, dto.sessionToken);
  }

  @Post('qr/approve')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Authenticated mobile: approve web login (issues same session as password login)',
  })
  @ApiCreatedResponse({ type: OkTrueOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 410, type: ApiErrorEnvelopeDto })
  qrApprove(@GetUser('id') userId: string, @Body() dto: QrSessionTokenDto) {
    return this.authService.qrApprove(userId, dto.sessionToken);
  }

  @Post('qr/reject')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Authenticated mobile: reject web QR login after scan',
  })
  @ApiCreatedResponse({ type: OkTrueOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 404, type: ApiErrorEnvelopeDto })
  @ApiResponse({ status: 410, type: ApiErrorEnvelopeDto })
  qrReject(@GetUser('id') userId: string, @Body() dto: QrSessionTokenDto) {
    return this.authService.qrReject(userId, dto.sessionToken);
  }

  @Post('forgot-password/request-otp')
  @ApiOperation({
    summary: 'Request OTP for password reset',
    description:
      'Same resend rules as registration: rate limits, max resends per active code, and cooldown between sends.',
  })
  @ApiCreatedResponse({ type: SimpleMessageOpenApiDto })
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
  @ApiCreatedResponse({ type: TokenOnlyOpenApiDto })
  forgotPasswordVerifyOtp(
    @Body() dto: VerifyContactOtpDto,
  ): Promise<{ token: string }> {
    return this.authService.forgotPasswordVerifyOtp(dto);
  }

  @Post('forgot-password/reset')
  @ApiOperation({ summary: 'Set new password after forgot-password OTP' })
  @ApiCreatedResponse({ type: SimpleMessageOpenApiDto })
  @ApiResponse({ status: 400, type: ApiErrorEnvelopeDto })
  forgotPasswordReset(@Body() dto: ForgotPasswordResetDto) {
    return this.authService.forgotPasswordReset(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and get new access token' })
  @ApiCreatedResponse({ type: RefreshTokensOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  refresh(@Body() dto: RefreshBodyDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke current refresh token' })
  @ApiCreatedResponse({ type: SimpleMessageOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
  logout(@Body() dto: LogoutBodyDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke all refresh tokens for current user' })
  @ApiCreatedResponse({ type: SimpleMessageOpenApiDto })
  @ApiResponse({ status: 401, type: ApiErrorEnvelopeDto })
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
