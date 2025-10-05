import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export const IsULID = (validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isULID',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          // ULID regex: 26 chars, Crockford's Base32
          return (
            typeof value === 'string' &&
            /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/.test(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid ULID`;
        },
      },
    });
  };
};
