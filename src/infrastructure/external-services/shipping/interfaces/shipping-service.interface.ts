import { ShippingOption } from '../types/shipping-option.type';

export interface ShippingService {
  calculateShipping(
    fromPostalCode: string,
    toPostalCode: string,
  ): Promise<ShippingOption[]>;
} 