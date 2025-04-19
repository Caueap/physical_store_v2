import { DistanceResult } from '../../distance/types/distance-result.type';
import { UserLocationInfo } from '../types/user-location-info.type';

export interface LocationService {
  getUserLocationFromCep(cep: string): Promise<UserLocationInfo>;
  calculateDistances(
    origins: { lat: number; lng: number },
    destinations: Array<{ lat: string | number; lng: string | number }>,
  ): Promise<DistanceResult[]>;
} 