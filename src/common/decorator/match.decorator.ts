import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchBetweenFields', async: false })
export class MatchBetweenFields implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    return value === args.object['password'];
  }

  defaultMessage(args?: ValidationArguments): string {
    return `failed to match between ${args?.property} and ${args?.constraints[0]}`;
  }
}

export function IsMatch(
  constraints: string[] = [],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: constraints,
      validator: MatchBetweenFields,
    });
  };
}
