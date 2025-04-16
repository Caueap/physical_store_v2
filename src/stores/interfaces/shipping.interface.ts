interface ShippingOption {
    shippingDays: string;
    operationTypeCode?: string;
    price: string;
    company?: string;
    operation?: string;
    description: string;
  }
  
  interface LocationWithShipping {
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