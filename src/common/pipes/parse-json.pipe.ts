import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseJSONPipe implements PipeTransform {
  transform(value: unknown, metadata?: ArgumentMetadata): unknown {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException(
        `${metadata?.data ?? 'value'} is not valid JSON`,
      );
    }
  }
}
