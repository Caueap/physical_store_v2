import { Coordinates } from '../../geocoding/types/coordinates.type';
import { DistanceResult } from '../types/distance-result.type';

export interface DistanceService {
  calculateDistances(
    origin: Coordinates,
    destinations: Array<{ lat: string | number; lng: string | number }>,
  ): Promise<DistanceResult[]>;
} 