import { HttpException, HttpStatus } from '@nestjs/common';

export interface DomainExceptionResponse {
  message: string;
  code: string;
  context?: Record<string, any>;
}

export class DomainException extends HttpException {
  constructor(
    response: string | DomainExceptionResponse,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    let formattedResponse: DomainExceptionResponse;
    
    if (typeof response === 'string') {
      formattedResponse = {
        message: response,
        code: 'DOMAIN_ERROR'
      };
    } else {
      formattedResponse = response;
    }
    
    super(formattedResponse, status);
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, identifier?: string | number) {
    const context = identifier ? { identifier } : undefined;
    
    super({
      message: `${entityName} not found${identifier ? ` with identifier: ${identifier}` : ''}`,
      code: 'ENTITY_NOT_FOUND',
      context
    }, HttpStatus.NOT_FOUND);
  }
}

export class DuplicateEntityException extends DomainException {
  constructor(entityName: string, identifier?: string) {
    const context = identifier ? { identifier } : undefined;
    
    super({
      message: `${entityName} already exists${identifier ? ` with identifier: ${identifier}` : ''}`,
      code: 'DUPLICATE_ENTITY',
      context
    }, HttpStatus.CONFLICT);
  }
}

export class EntityRelationshipException extends DomainException {
  constructor(message: string) {
    super({
      message,
      code: 'ENTITY_RELATIONSHIP_ERROR'
    }, HttpStatus.BAD_REQUEST);
  }
}

export class ValidationException extends DomainException {
  constructor(message: string, validationErrors?: Record<string, any>) {
    super({
      message,
      code: 'VALIDATION_ERROR',
      context: validationErrors ? { validationErrors } : undefined
    }, HttpStatus.BAD_REQUEST);
  }
}

export class BusinessRuleException extends DomainException {
  static readonly STORE_LOCATION_CONFLICT = 'STORE_LOCATION_CONFLICT';
  static readonly STORE_INVALID_HOURS = 'STORE_INVALID_HOURS';
  static readonly STORE_INVALID_SHIPPING = 'STORE_INVALID_SHIPPING';
  
  constructor(message: string, ruleId?: string) {
    super({
      message,
      code: 'BUSINESS_RULE_VIOLATION',
      context: ruleId ? { ruleId } : undefined
    }, HttpStatus.BAD_REQUEST);
  }
}

export class ExternalServiceException extends DomainException {
  constructor(serviceName: string, message: string, originalError?: Error) {
    super({
      message: `${serviceName} service error: ${message}`,
      code: 'EXTERNAL_SERVICE_ERROR',
      context: originalError ? { 
        originalMessage: originalError.message,
        stack: originalError.stack
      } : undefined
    }, HttpStatus.SERVICE_UNAVAILABLE);
  }
} 