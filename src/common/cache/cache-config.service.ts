import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService {
  constructor(private readonly configService: ConfigService) {}

  private readonly DEFAULT_TTL = {
    LOCATION: 30 * 60 * 1000,
    ADDRESS: 24 * 60 * 60 * 1000,
    SHIPPING: 24 * 60 * 60 * 1000,
    DISTANCE: 12 * 60 * 60 * 1000,
  };

  getShippingCacheKey(originPostalCode: string, destinationPostalCode: string): string {
    return `shipping:${originPostalCode}:${destinationPostalCode}`;
  }

  getLocationCacheKey(postalCode: string): string {
    return `location:${postalCode}`;
  }

  getDistanceCacheKey(originLat: number, originLng: number, destLat: number, destLng: number): string {
    return `distance:${originLat},${originLng}:${destLat},${destLng}`;
  }

  getStoreByStateCacheKey(state?: string, limit = 10, offset = 0): string {
    return `stores:state:${state || 'all'}:${limit}:${offset}`;
  }

  getPdvByStateCacheKey(state?: string, limit = 10, offset = 0): string {
    return `pdvs:state:${state || 'all'}:${limit}:${offset}`;
  }

  getStoreByCepCacheKey(cep: string, limit = 10, offset = 0): string {
    return `stores:cep:${cep}:${limit}:${offset}`;
  }
  
  getPdvByCepCacheKey(cep: string, limit = 10, offset = 0): string {
    return `pdvs:cep:${cep}:${limit}:${offset}`;
  }
  
  getLocationTTL(): number {
    return this.configService.get<number>('CACHE_LOCATION_TTL_MS', this.DEFAULT_TTL.LOCATION);
  }

  getAddressTTL(): number {
    return this.configService.get<number>('CACHE_ADDRESS_TTL_MS', this.DEFAULT_TTL.ADDRESS);
  }

  getShippingTTL(): number {
    return this.configService.get<number>('CACHE_SHIPPING_TTL_MS', 3600000);
  }

  getDistanceTTL(): number {
    return this.configService.get<number>('CACHE_DISTANCE_TTL_MS', 86400000);
  }

  getStoreTTL(): number {
    return this.configService.get<number>('STORE_CACHE_TTL_MS', 600000);
  }
  
  getPdvTTL(): number {
    return this.configService.get<number>('PDV_CACHE_TTL_MS', 600000);
  }

  getGeocodingTTL(): number {
    return this.configService.get<number>('CACHE_GEOCODING_TTL_MS', 2592000000);
  }

  getDefaultTTL(): number {
    return this.configService.get<number>('CACHE_DEFAULT_TTL_MS', 300000);
  }
} 