import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function isStrongPasswordValue(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  if (value.length < 8 || value.length > 128) {
    return false;
  }
  if (!/[a-z]/.test(value)) {
    return false;
  }
  if (!/[A-Z]/.test(value)) {
    return false;
  }
  if (!/[0-9]/.test(value)) {
    return false;
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return false;
  }
  return true;
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return isStrongPasswordValue(value);
        },
        defaultMessage(_args: ValidationArguments) {
          return 'Password must be 8–128 characters and include uppercase, lowercase, a number, and a special character';
        },
      },
    });
  };
}
