import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { DomainException, DomainExceptionResponse } from '../exceptions/domain.exceptions';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  error: string;
  message: string;
  code?: string;
  context?: Record<string, any>;
  errors?: string[];
  stack?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();

    let statusCode: number;
    let message: string;
    let error: string;
    let code: string | undefined;
    let context: Record<string, any> | undefined;
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (exception instanceof DomainException && 
          typeof exceptionResponse === 'object' && 
          exceptionResponse !== null) {
        const domainResponse = exceptionResponse as DomainExceptionResponse;
        message = domainResponse.message;
        code = domainResponse.code;
        context = domainResponse.context;
        error = exception.name;
      }
      else if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        const exceptionMessage = exceptionResponse['message'];
        message = Array.isArray(exceptionMessage)
          ? (exceptionMessage as string[]).join(', ')
          : String(exceptionMessage);
        const errorValue = exceptionResponse['error'];
        error = typeof errorValue === 'string' 
          ? errorValue 
          : exception.name as string;
        code = 'VALIDATION_ERROR';
        
        if ('errors' in exceptionResponse && Array.isArray(exceptionResponse['errors'])) {
          errors = exceptionResponse['errors'];
        }
      } else {
        message = exception.message;
        error = exception.name as string;
      }
    } else if (exception.code === 11000) {
      statusCode = HttpStatus.CONFLICT;
      error = 'Duplicate Key Error';
      code = 'MONGODB_DUPLICATE_KEY';
      const keyPattern = exception.keyPattern ? Object.keys(exception.keyPattern)[0] : 'unknown';
      const keyValue = exception.keyValue ? exception.keyValue[keyPattern] : 'unknown';
      message = `Duplicate value for ${keyPattern}: ${keyValue}`;
      context = { 
        keyPattern: exception.keyPattern,
        keyValue: exception.keyValue
      };
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = (typeof exception.name === 'string' ? exception.name : 'InternalServerError') as string;
      code = 'INTERNAL_SERVER_ERROR';
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
    };

    if (code) {
      errorResponse.code = code;
    }

    if (context) {
      errorResponse.context = context;
    }
    
    if (errors) {
      errorResponse.errors = errors;
    }

    if (exception.stack) {
      errorResponse.stack = exception.stack;
    }

    this.logger.error(
      `[${request.method}] ${request.url} - ${statusCode}: ${message}`,
      exception.stack,
    );

    response.status(statusCode).send(errorResponse);
  }
} 