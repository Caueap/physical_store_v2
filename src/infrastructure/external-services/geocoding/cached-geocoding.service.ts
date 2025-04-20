import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GeocodingService } from './interfaces/geocoding-service.interface';
import { Coordinates } from './types/coordinates.type';
import { CacheConfigService } from '../../../common/cache/cache-config.service';

@Injectable()
export class CachedGeocodingService implements GeocodingService {
  private readonly logger = new Logger(CachedGeocodingService.name);

  constructor(
    @Inject('GeocodingService') private readonly geocodingService: GeocodingService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly cacheConfig: CacheConfigService,
  ) {}

  async getCoordinatesFromAddress(address: string): Promise<Coordinates> {
    try {
      const normalizedAddress = this.normalizeAddress(address);
      const cacheKey = `geocoding:${normalizedAddress}`;

      const cachedResult = await this.cacheManager.get<Coordinates>(cacheKey);

      if (cachedResult) {
        this.logger.debug(`Cache hit for address: ${normalizedAddress}`);
        return cachedResult;
      }

      this.logger.debug(`Cache miss for address: ${normalizedAddress}`);
      
      const coordinates = await this.geocodingService.getCoordinatesFromAddress(address);
      
      await this.cacheManager.set(
        cacheKey, 
        coordinates,
        this.cacheConfig.getGeocodingTTL()
      );
      
      return coordinates;
    } catch (error) {
      this.logger.error(`Error getting coordinates from address: ${error.message}`, error.stack);
      return this.geocodingService.getCoordinatesFromAddress(address);
    }
  }

  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }
} 