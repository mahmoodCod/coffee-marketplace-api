import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

import { Request, Response } from 'express';

/**
 * ------------------------------------------------------------------------
 * Global HTTP Exception Filter
 * ------------------------------------------------------------------------
 *
 * Standardizes every HTTP error response.
 *
 * This filter catches every HttpException thrown by the application
 * and returns a consistent response format.
 *
 * Applied globally from main.ts.
 * ------------------------------------------------------------------------
 */

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(
    exception: HttpException,

    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();

    const request = ctx.getRequest<Request>();

    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();

    let message: string | string[];

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      message = (exceptionResponse as any).message;
    }

    response.status(status).json({
      success: false,

      statusCode: status,

      message,

      timestamp: new Date().toISOString(),

      path: request.url,
    });
  }
}
