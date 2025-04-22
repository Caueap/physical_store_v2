import {
  DomainException,
  EntityNotFoundException,
  DuplicateEntityException,
  EntityRelationshipException,
  ValidationException,
  BusinessRuleException,
  ExternalServiceException
} from './domain.exceptions';
import { HttpStatus } from '@nestjs/common';

describe('Domain Exceptions', () => {
  describe('DomainException', () => {
    it('should create a DomainException with the given message', () => {
      const exception = new DomainException('Test domain exception');
      expect(exception.message).toBe('Test domain exception');
      expect(exception.name).toBe('DomainException');
      expect(exception instanceof Error).toBe(true);
    });
  });

  describe('EntityNotFoundException', () => {
    it('should create an EntityNotFoundException with the entity name and ID', () => {
      const exception = new EntityNotFoundException('Store', '123');
      expect(exception.message).toContain('Store not found with identifier: 123');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception instanceof DomainException).toBe(true);
    });

    it('should create an EntityNotFoundException with just the entity name', () => {
      const exception = new EntityNotFoundException('Store');
      expect(exception.message).toContain('Store not found');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('DuplicateEntityException', () => {
    it('should create a DuplicateEntityException with the entity name and field', () => {
      const exception = new DuplicateEntityException('Store', 'storeName');
      expect(exception.message).toContain('Store already exists with identifier: storeName');
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception instanceof DomainException).toBe(true);
    });

    it('should create a DuplicateEntityException with just the entity name', () => {
      const exception = new DuplicateEntityException('Store');
      expect(exception.message).toContain('Store already exists');
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    });
  });

  describe('EntityRelationshipException', () => {
    it('should create an EntityRelationshipException with the given message', () => {
      const exception = new EntityRelationshipException('Cannot delete Store because it has PDVs');
      expect(exception.message).toBe('Cannot delete Store because it has PDVs');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception instanceof DomainException).toBe(true);
    });
  });

  describe('ValidationException', () => {
    it('should create a ValidationException with the given message', () => {
      const validationErrors = [
        { field: 'storeName', message: 'Store name is required' },
        { field: 'latitude', message: 'Latitude must be a number' }
      ];
      
      const exception = new ValidationException('Validation failed', validationErrors);
      expect(exception.message).toBe('Validation failed');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception instanceof DomainException).toBe(true);
    });

    it('should create a ValidationException with message only', () => {
      const exception = new ValidationException('Validation failed');
      expect(exception.message).toBe('Validation failed');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('BusinessRuleException', () => {
    it('should create a BusinessRuleException with the given message', () => {
      const exception = new BusinessRuleException('Cannot create store with invalid address');
      expect(exception.message).toBe('Cannot create store with invalid address');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception instanceof DomainException).toBe(true);
    });

    it('should create a BusinessRuleException with rule ID', () => {
      const exception = new BusinessRuleException(
        'Store hours are invalid', 
        BusinessRuleException.STORE_INVALID_HOURS
      );
      expect(exception.message).toBe('Store hours are invalid');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('ExternalServiceException', () => {
    it('should create an ExternalServiceException with service name and message', () => {
      const exception = new ExternalServiceException('Google Maps API', 'Rate limit exceeded');
      expect(exception.message).toContain('Google Maps API service error: Rate limit exceeded');
      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(exception instanceof DomainException).toBe(true);
    });

    it('should create an ExternalServiceException with service name, message and original error', () => {
      const originalError = new Error('Original error');
      const exception = new ExternalServiceException('Google Maps API', 'Rate limit exceeded', originalError);
      expect(exception.message).toContain('Google Maps API service error: Rate limit exceeded');
      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });
}); 