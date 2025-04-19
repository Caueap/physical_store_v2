import { LocationWithShipping } from './location-with-shipping.type';
import { MapPin } from './map-pin.type';

export type StoresByCepResponse = {
  stores: LocationWithShipping[];
  pins: MapPin[];
  limit: number;
  offset: number;
  total: number;
} 