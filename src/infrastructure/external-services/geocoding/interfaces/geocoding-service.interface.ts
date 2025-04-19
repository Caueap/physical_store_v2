import { Coordinates } from '../types/coordinates.type';

export interface GeocodingService {
  getCoordinatesFromAddress(address: string): Promise<Coordinates>;
} 