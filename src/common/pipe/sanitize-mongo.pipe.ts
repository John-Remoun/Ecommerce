import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

const OPERATOR_PATTERN = /^\$/;
const DOT_PATTERN = /\./;

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (OPERATOR_PATTERN.test(key) || DOT_PATTERN.test(key)) {
        throw new BadRequestException(`Invalid query key: ${key}`);
      }

      sanitized[key] = sanitizeValue(nestedValue);
    }

    return sanitized;
  }

  return value;
}

@Injectable()
export class SanitizeMongoPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'query' && metadata.type !== 'body') {
      return value;
    }

    if (value === undefined || value === null) {
      return value;
    }

    return sanitizeValue(value);
  }
}
