import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

export const IsULID = (validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isULID',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string): boolean {
          // ULID regex: 26 chars, Crockford's Base32
          return (
            typeof value === 'string' &&
            /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/.test(value)
          );
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid ULID`;
        },
      },
    });
  };
};
