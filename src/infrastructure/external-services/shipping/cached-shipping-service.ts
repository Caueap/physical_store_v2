import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ShippingService } from './interfaces/shipping-service.interface';
import { ShippingOption } from './types/shipping-option.type';
import { CacheConfigService } from '../../../common/cache/cache-config.service';

@Injectable()
export class CachedShippingServiceImpl implements ShippingService {
  private readonly logger = new Logger(CachedShippingServiceImpl.name);

  constructor(
    @Inject('ShippingService') private readonly shippingService: ShippingService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly cacheConfig: CacheConfigService,
  ) {}

  async calculateShipping(
    fromPostalCode: string,
    toPostalCode: string,
  ): Promise<ShippingOption[]> {
    try {
      const normalizedFromPostalCode = this.normalizePostalCode(fromPostalCode);
      const normalizedToPostalCode = this.normalizePostalCode(toPostalCode);
      const cacheKey = `shipping:${normalizedFromPostalCode}:${normalizedToPostalCode}`;

      const cachedResult = await this.cacheManager.get<ShippingOption[]>(cacheKey);

      if (cachedResult) {
        this.logger.debug(`Cache hit for shipping calculation: ${normalizedFromPostalCode} to ${normalizedToPostalCode}`);
        return cachedResult;
      }

      this.logger.debug(`Cache miss for shipping calculation: ${normalizedFromPostalCode} to ${normalizedToPostalCode}`);
      
      const shippingOptions = await this.shippingService.calculateShipping(
        fromPostalCode,
        toPostalCode
      );
      
      await this.cacheManager.set(
        cacheKey, 
        shippingOptions,
        this.cacheConfig.getShippingTTL()
      );
      
      return shippingOptions;
    } catch (error) {
      this.logger.error(`Error calculating shipping: ${error.message}`, error.stack);
      return this.shippingService.calculateShipping(fromPostalCode, toPostalCode);
    }
  }

  private normalizePostalCode(postalCode: string): string {
    return postalCode.replace(/\D/g, '');
  }
} 