import { ShippingOption } from '../../../infrastructure/external-services/shipping/types/shipping-option.type';

export type LocationWithShipping = {
  name: string;
  city: string;
  postalCode: string;
  type: 'LOJA' | 'PDV';
  distance: string;
  value: ShippingOption[];
  coordinates: {
    lat: string;
    lng: string;
  };
} 