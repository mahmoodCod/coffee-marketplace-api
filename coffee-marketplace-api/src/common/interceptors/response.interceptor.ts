import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * ------------------------------------------------------------------------
 * Response Interceptor
 * ------------------------------------------------------------------------
 *
 * Wraps every successful HTTP response inside a unified response format.
 *
 * Responsibilities:
 * - Keep API responses consistent
 * - Reduce duplicated response formatting
 * - Provide common metadata for every endpoint
 *
 * Notes:
 * This interceptor only affects successful responses.
 * Exceptions are handled separately by the global exception filter.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => ({
        success: true,

        statusCode: response.statusCode,

        message: 'Request completed successfully.',

        data,

        timestamp: new Date().toISOString(),
      })),
    );
  }
}
