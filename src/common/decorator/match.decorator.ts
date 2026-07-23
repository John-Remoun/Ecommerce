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
  return value === (args.object as any)[args.constraints[0]];
}

  defaultMessage(args?: ValidationArguments): string {
    return `failed to match between ${args?.property} and ${args?.constraints[0]}`;
  }
}

export function IsMatch(
  relatedPropertyName: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [relatedPropertyName],
      validator: MatchBetweenFields,
    });
  };
}
