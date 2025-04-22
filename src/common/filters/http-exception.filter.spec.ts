import { HttpStatus, HttpException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import {
  EntityNotFoundException,
  ValidationException,
  BusinessRuleException,
} from '../exceptions/domain.exceptions';
import { ArgumentsHost } from '@nestjs/common';
import { Logger } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockArgumentsHost: ArgumentsHost;
  
  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnValue({ send: mockJson });
    mockGetRequest = jest.fn().mockReturnValue({ 
      url: 'test/url',
      method: 'GET'
    });
    mockGetResponse = jest.fn().mockReturnValue({
      status: mockStatus
    });
    
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    } as unknown as ArgumentsHost;

    filter = new HttpExceptionFilter();
    
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should handle standard HttpException', () => {
      // Arrange
      const exception = new HttpException('Test error message', HttpStatus.BAD_REQUEST);
      
      // Act
      filter.catch(exception, mockArgumentsHost);
      
      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'HttpException',
          message: 'Test error message',
          path: 'test/url'
        })
      );
    });
    
    it('should handle BadRequestException with array message', () => {
      // Arrange
      const exception = new BadRequestException({
        message: ['Error 1', 'Error 2'],
        error: 'Bad Request'
      });
      
      // Act
      filter.catch(exception, mockArgumentsHost);
      
      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Error 1, Error 2',
          code: 'VALIDATION_ERROR',
          path: 'test/url'
        })
      );
    });
    
    it('should handle DomainException as EntityNotFoundException', () => {
      // Arrange
      const exception = new EntityNotFoundException('Store', '12345');
      
      // Act
      filter.catch(exception, mockArgumentsHost);
      
      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'EntityNotFoundException',
          message: 'Store not found with identifier: 12345',
          code: 'ENTITY_NOT_FOUND',
          context: { identifier: '12345' },
          path: 'test/url'
        })
      );
    });
    
    it('should handle DomainException as ValidationException', () => {
      // Arrange
      const validationErrors = ['Field1 is required', 'Field2 must be a number'];
      const exception = new ValidationException('Validation failed', validationErrors);
      
      // Act
      filter.catch(exception, mockArgumentsHost);
      
      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'ValidationException',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          context: { validationErrors },
          path: 'test/url'
        })
      );
    });
    
    it('should handle DomainException as BusinessRuleException', () => {
      // Arrange
      const exception = new BusinessRuleException(
        'Cannot delete store with active PDVs',
        'STORE_HAS_ACTIVE_PDVS'
      );
      
      // Act
      filter.catch(exception, mockArgumentsHost);
      
      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'BusinessRuleException',
          message: 'Cannot delete store with active PDVs',
          code: 'BUSINESS_RULE_VIOLATION',
          context: { ruleId: 'STORE_HAS_ACTIVE_PDVS' },
          path: 'test/url'
        })
      );
    });
    
    it('should handle MongoDB duplicate key errors', () => {
      // Arrange
      const exception = {
        code: 11000,
        keyPattern: { email: 1 },
        keyValue: { email: 'test@example.com' }
      };
      
      // Act
      filter.catch(exception, mockArgumentsHost);
      
      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.CONFLICT,
          error: 'Duplicate Key Error',
          message: 'Duplicate value for email: test@example.com',
          code: 'MONGODB_DUPLICATE_KEY',
          context: {
            keyPattern: { email: 1 },
            keyValue: { email: 'test@example.com' }
          },
          path: 'test/url'
        })
      );
    });
    
    it('should handle unspecified errors as internal server error', () => {
      // Arrange
      const exception = new Error('Something went wrong');
      
      // Act
      filter.catch(exception, mockArgumentsHost);
      
      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error',
          message: 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR',
          path: 'test/url'
        })
      );
    });
    
    it('should include stack trace in response', () => {
      // Arrange
      const exception = new InternalServerErrorException('Server error');
      exception.stack = 'Error: Server error\n    at Test.someFunction (/app/src/test.ts:10:5)';
      
      // Act
      filter.catch(exception, mockArgumentsHost);
      
      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: exception.stack
        })
      );
    });
    
    it('should handle HttpException with validation errors array', () => {
      // Arrange
      const exception = new BadRequestException({
        message: 'Validation failed',
        error: 'Bad Request',
        errors: ['Field1 is required', 'Field2 must be a number']
      });
      
      // Act
      filter.catch(exception, mockArgumentsHost);
      
      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: ['Field1 is required', 'Field2 must be a number'],
          path: 'test/url'
        })
      );
    });
  });
}); 