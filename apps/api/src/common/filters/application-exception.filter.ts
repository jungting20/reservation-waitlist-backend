import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApplicationError } from '../errors/application.error';

@Catch(ApplicationError)
export class ApplicationExceptionFilter implements ExceptionFilter {
  catch(exception: ApplicationError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = exception.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(statusCode).json({
      statusCode,
      code: exception.code,
      message: exception.message,
    });
  }
}
