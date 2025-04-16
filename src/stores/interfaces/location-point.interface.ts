import { Types } from 'mongoose';

export interface LocationPoint {
    type: 'STORE' | 'PDV';
    storeId: Types.ObjectId;
    pdvId?: Types.ObjectId;
    lat: string;
    lng: string;
    storeName: string;
    pdvName?: string;
    distance?: string;
    duration?: string;
    distanceValue?: number;
    distanceKm?: number;
  }