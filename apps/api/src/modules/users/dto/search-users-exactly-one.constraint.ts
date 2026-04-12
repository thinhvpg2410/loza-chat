import type {
  ValidationArguments,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ValidatorConstraint } from 'class-validator';

function isNonEmptyString(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

type SearchQueryShape = {
  phoneNumber?: string;
  email?: string;
  username?: string;
};

@ValidatorConstraint({ name: 'SearchUsersExactlyOne', async: false })
export class SearchUsersExactlyOneConstraint
  implements ValidatorConstraintInterface
{
  validate(_: unknown, args: ValidationArguments): boolean {
    const o = args.object as SearchQueryShape;
    const n = [
      isNonEmptyString(o.phoneNumber),
      isNonEmptyString(o.email),
      isNonEmptyString(o.username),
    ].filter(Boolean).length;
    return n === 1;
  }

  defaultMessage(): string {
    return 'Provide exactly one of phoneNumber, email, or username';
  }
}
