import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import type { ClassConstructor } from 'class-transformer/types/interfaces';

export class WsPayloadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WsPayloadValidationError';
  }
}

export function parseWsPayload<T extends object>(
  Cls: ClassConstructor<T>,
  body: unknown,
): T {
  const inst = plainToInstance(Cls, body ?? {}, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(inst, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0) {
    const msg = errors
      .flatMap((e) => Object.values(e.constraints ?? {}))
      .join('; ');
    throw new WsPayloadValidationError(msg);
  }
  return inst;
}
