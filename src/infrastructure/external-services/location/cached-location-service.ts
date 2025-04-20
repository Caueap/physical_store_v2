import { Inject, Injectable, Logger } from '@nestjs/common';
import { ViaCepService } from '../viacep/interfaces/viacep-service.interface';
import { GeocodingService } from '../geocoding/interfaces/geocoding-service.interface';
import { DistanceService } from '../distance/interfaces/distance-service.interface';
import { LocationService } from './interfaces/location-service.interface';
import { UserLocationInfo } from './types/user-location-info.type';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheConfigService } from '../../../common/cache/cache-config.service';
import { DistanceResult } from '../distance/types/distance-result.type';
import { Coordinates } from '../geocoding/types/coordinates.type';
import { LocationPoint } from '../../../domains/stores/interfaces/location-point.interface';

@Injectable()
export class CachedLocationServiceImpl implements LocationService {
  private readonly logger = new Logger(CachedLocationServiceImpl.name);
  
  constructor(
    @Inject('ViaCepService')
    private viaCepService: ViaCepService,
    @Inject('GeocodingService')
    private geocodingService: GeocodingService,
    @Inject('DistanceService')
    private distanceService: DistanceService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private cacheConfigService: CacheConfigService,
  ) {}

  async getUserLocationFromCep(cep: string): Promise<UserLocationInfo> {
    const normalizedCep = cep.replace(/\D/g, '');
    const cacheKey = this.cacheConfigService.getLocationCacheKey(normalizedCep);
    
    const cachedResult = await this.cacheManager.get<UserLocationInfo>(cacheKey);
    if (cachedResult) {
      this.logger.log(`Cache hit for location data: ${cacheKey}`);
      return cachedResult;
    }
    
    this.logger.log(`Cache miss for location data: ${cacheKey}`);
    
    const viaCepAddress = await this.viaCepService.getAddressFromCep(normalizedCep);
    const { logradouro, localidade, uf, cep: formattedCep } = viaCepAddress;

    const fullAddress = `${logradouro}, ${localidade}, ${uf}`;

    const userCoordinates = await this.geocodingService.getCoordinatesFromAddress(fullAddress);

    const result = {
      fullAddress,
      formattedCep,
      userCoordinates,
      locationInfo: viaCepAddress
    };
    
    await this.cacheManager.set(
      cacheKey, 
      result, 
      this.cacheConfigService.getLocationTTL()
    );
    
    return result;
  }

  async calculateDistances(
    origins: { lat: number; lng: number },
    destinations: Array<{ lat: string | number; lng: string | number }>
  ): Promise<DistanceResult[]> {
    if (destinations.length === 0) {
      return [];
    }
    
    const shouldUseCache = destinations.length <= 10;
    
    if (shouldUseCache) {
      const results: DistanceResult[] = [];
      
      for (const destination of destinations) {
        const destLat = typeof destination.lat === 'string' 
          ? parseFloat(destination.lat) 
          : destination.lat;
          
        const destLng = typeof destination.lng === 'string' 
          ? parseFloat(destination.lng) 
          : destination.lng;
          
        if (isNaN(destLat) || isNaN(destLng)) {
          results.push({
            distance: 'N/A',
            duration: 'N/A',
            distanceValue: 0,
            distanceKm: 0
          });
          continue;
        }
          
        const cacheKey = this.cacheConfigService.getDistanceCacheKey(
          origins.lat,
          origins.lng,
          destLat,
          destLng
        );
        
        const cachedResult = await this.cacheManager.get<DistanceResult>(cacheKey);
        if (cachedResult) {
          this.logger.log(`Cache hit for distance calculation: ${cacheKey}`);
          results.push(cachedResult);
          continue;
        }
        
        this.logger.log(`Cache miss for distance calculation: ${cacheKey}`);
        
        const calculatedResults = await this.distanceService.calculateDistances(
          origins, 
          [{ lat: destLat, lng: destLng }]
        );
        
        if (calculatedResults.length > 0) {
          await this.cacheManager.set(
            cacheKey, 
            calculatedResults[0], 
            this.cacheConfigService.getDistanceTTL()
          );
          
          results.push(calculatedResults[0]);
        } else {
          const fallbackResult = {
            distance: 'N/A',
            duration: 'N/A',
            distanceValue: 0,
            distanceKm: 0
          };
          results.push(fallbackResult);
        }
      }
      
      return results;
    } else {
      return this.distanceService.calculateDistances(origins, destinations);
    }
  }

  async findNearbyStores(
    coordinates: Coordinates,
    radius: number,
  ): Promise<LocationPoint[]> {
    const cacheKey = `location:nearby:${coordinates.lat}:${coordinates.lng}:${radius}`;
    
    const cachedResult = await this.cacheManager.get<LocationPoint[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    this.logger.warn(`findNearbyStores called but not fully implemented`);
    return [];
  }

  async findByAddress(address: string): Promise<Coordinates | null> {
    const cacheKey = `location:address:${address}`;
    
    const cachedResult = await this.cacheManager.get<Coordinates>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      return await this.geocodingService.getCoordinatesFromAddress(address);
    } catch (error) {
      this.logger.error(`Error in findByAddress: ${error.message}`, error.stack);
      return null;
    }
  }
} 