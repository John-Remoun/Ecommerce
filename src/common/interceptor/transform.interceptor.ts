import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'message' in data
        ) {
          return data as ApiResponse<T>;
        }

        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'data' in data
        ) {
          return {
            success: true,
            message: (data as { message: string }).message,
            data: (data as { data: T }).data,
          };
        }

        return {
          success: true,
          message: 'Success',
          data: data as T,
        };
      }),
    );
  }
}
