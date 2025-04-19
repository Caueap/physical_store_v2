import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new LoggerService('HTTP');

  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    const startTime = process.hrtime();

    this.logger.logRequest(req);

    const originalSend = res.send;
    let responseBody: any;

    res.send = function (payload: any): FastifyReply {
      responseBody = payload;

      const responseTime = process.hrtime(startTime);
      this.logger.logResponse(req, res, responseBody, responseTime);

      return originalSend.call(this, payload);
    }.bind(this);

    next();
  }
} 