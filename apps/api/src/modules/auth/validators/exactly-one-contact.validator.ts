import type {
  ValidationArguments,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ValidatorConstraint } from 'class-validator';

@ValidatorConstraint({ name: 'ExactlyOneContact', async: false })
export class ExactlyOneContactConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const o = args.object as {
      phoneNumber?: string;
      email?: string;
    };
    const p = o.phoneNumber?.trim();
    const e = o.email?.trim();
    const hasP = Boolean(p);
    const hasE = Boolean(e);
    return hasP !== hasE;
  }

  defaultMessage(): string {
    return 'Provide exactly one of phoneNumber or email';
  }
}
