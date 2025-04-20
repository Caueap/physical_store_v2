import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DistanceService } from './interfaces/distance-service.interface';
import { Coordinates } from '../geocoding/types/coordinates.type';
import { DistanceResult } from './types/distance-result.type';
import { CacheConfigService } from '../../../common/cache/cache-config.service';

@Injectable()
export class CachedDistanceService implements DistanceService {
  private readonly logger = new Logger(CachedDistanceService.name);

  constructor(
    @Inject('DistanceService') private readonly distanceService: DistanceService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly cacheConfig: CacheConfigService,
  ) {}

  async calculateDistances(
    origin: Coordinates,
    destinations: Coordinates[],
  ): Promise<DistanceResult[]> {
    const cacheKey = this.generateCacheKey(origin, destinations);
    
    try {
      const cachedResult = await this.cacheManager.get<DistanceResult[]>(cacheKey);
      
      if (cachedResult) {
        this.logger.debug(`Cache hit for distance calculation from (${origin.lat},${origin.lng})`);
        return cachedResult;
      }
      
      this.logger.debug(`Cache miss for distance calculation from (${origin.lat},${origin.lng}), calculating...`);
      const result = await this.distanceService.calculateDistances(origin, destinations);
      
      await this.cacheManager.set(
        cacheKey, 
        result, 
        this.cacheConfig.getDistanceTTL(),
      );
      
      return result;
    } catch (error) {
      this.logger.error(`Error in cached distance calculation: ${error.message}`, error.stack);
      return this.distanceService.calculateDistances(origin, destinations);
    }
  }

  private generateCacheKey(origin: Coordinates, destinations: Coordinates[]): string {
    const sortedDestinations = [...destinations].sort((a, b) => 
      a.lat - b.lat || a.lng - b.lng
    );
    
    const originString = `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`;
    const destinationsString = sortedDestinations.map(dest => 
      `${dest.lat.toFixed(6)},${dest.lng.toFixed(6)}`
    ).join('|');
    
    return `distance:${originString}:to:${destinationsString}`;
  }
} 