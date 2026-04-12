import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/http-exception.filter';

/**
 * Comma-separated list, e.g. `http://localhost:8081,http://127.0.0.1:8081`.
 * If unset (development), the request origin is reflected so Expo Web / LAN IPs work.
 */
function corsOriginOption(): CorsOptions['origin'] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return true;
  }
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 1 ? list[0] : list;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  const corsOptions: CorsOptions = {
    origin: corsOriginOption(),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: true,
    maxAge: 86400,
  };
  app.enableCors(corsOptions);

  app.useWebSocketAdapter(new IoAdapter(app));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Loza Chat API')
    .setDescription(
      [
        'REST API for Loza Chat (NestJS). Real-time features use Socket.IO on the same host; see gateway payloads in source under `realtime/`.',
        '',
        '**Authentication**',
        '- Most routes require `Authorization: Bearer <access_token>`.',
        '- Obtain tokens from `POST /auth/login`, `POST /auth/register/create-account`, `POST /auth/login/verify-device-otp`, `POST /auth/refresh`, or the one-time payload from `GET /auth/qr/status/:sessionToken` after mobile approval.',
        '- Refresh with `POST /auth/refresh` (body: `refreshToken`). Log out with `POST /auth/logout` or `POST /auth/logout-all` (Bearer).',
        '',
        '**Errors**',
        '- Failed requests return JSON: `{ "error": { "code": <http_status>, "message": "<string>" } }` (validation errors use the first message in `message`).',
        '',
        '**Uploads**',
        '- `POST /uploads/init` returns a presigned URL; the client PUTs bytes to storage, then calls `POST /uploads/:id/complete`. With `STORAGE_MOCK`, use `PUT /uploads/mock-upload/:sessionId` and avatar URLs may point at `GET /uploads/mock-public`.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT access token from login, registration, device OTP, refresh, or QR approval',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
