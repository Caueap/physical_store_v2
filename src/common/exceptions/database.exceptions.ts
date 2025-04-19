import { Logger } from '@nestjs/common';
import { MongoError } from 'mongodb';
import { DuplicateEntityException } from './domain.exceptions';

interface MongoDuplicateKeyError extends MongoError {
  keyPattern?: Record<string, any>;
  keyValue?: Record<string, any>;
}

export class DatabaseExceptionMapper {
  private static readonly logger = new Logger(DatabaseExceptionMapper.name);

  static mapMongoError(error: any, entityName: string): Error {
    if (error instanceof MongoError && error.code === 11000) {
      const mongoError = error as MongoDuplicateKeyError;
      const keyPattern = mongoError.keyPattern ? Object.keys(mongoError.keyPattern)[0] : 'unknown';
      const keyValue = mongoError.keyValue ? mongoError.keyValue[keyPattern] : 'unknown';
      return new DuplicateEntityException(entityName, `${keyPattern}: ${keyValue}`);
    }

    this.logger.error(`Unhandled database error for ${entityName}: ${error.message}`, error.stack);
    return error;
  }

  static async executeOperation<T>(
    operation: () => Promise<T>,
    entityName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw this.mapMongoError(error, entityName);
    }
  }
} 