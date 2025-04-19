import { Injectable, Logger, LoggerService as NestLoggerService } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;
  private logger: Logger;

  constructor(context?: string) {
    this.context = context;
    this.logger = new Logger(context || 'DefaultLogger');
  }

  log(message: any, context?: string): void {
    this.logger.log(message, context || this.context);
  }

  error(message: any, trace?: string, context?: string): void {
    this.logger.error(message, trace, context || this.context);
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, context || this.context);
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, context || this.context);
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, context || this.context);
  }

  logRequest(req: FastifyRequest): void {
    const message = {
      timestamp: new Date().toISOString(),
      userId: 'anonymous',
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'accept': req.headers['accept'],
      },
      query: req.query,
      body: this.sanitizeBody(req.body),
    };

    this.log(`Request: ${req.method} ${req.url}`, 'HttpRequest');
    
    this.verbose(JSON.stringify(message, null, 2), 'HttpRequest');
  }

  logResponse(req: FastifyRequest, res: FastifyReply, data?: any, startTime?: [number, number]): void {
    const executionTime = startTime 
      ? `${Math.round(process.hrtime(startTime)[1] / 1000000)}ms`
      : 'unknown';

    const message = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      executionTime
    };

    this.log(`Response: ${req.method} ${req.url} ${res.statusCode} - ${executionTime}`, 'HttpResponse');
    
    if (data) {
      this.verbose(JSON.stringify({
        ...message,
        response: this.sanitizeResponse(data)
      }, null, 2), 'HttpResponse');
    }
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret'];
    
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private sanitizeResponse(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'object') {
      if (data instanceof Error) {
        return {
          message: data.message,
          stack: data.stack
        };
      }
      
      const result = Array.isArray(data) 
        ? data.slice(0, 10).map(item => this.sanitizeResponse(item))
        : { ...data };
        
      if (Array.isArray(data) && data.length > 10) {
        return [...result, `... ${data.length - 10} more items`];
      }
      
      return result;
    }
    
    return data;
  }
} 