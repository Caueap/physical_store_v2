import { Inject, Injectable } from '@nestjs/common';
import { ViaCepService } from '../viacep/interfaces/viacep-service.interface';
import { GeocodingService } from '../geocoding/interfaces/geocoding-service.interface';
import { DistanceService } from '../distance/interfaces/distance-service.interface';
import { LocationService } from './interfaces/location-service.interface';
import { UserLocationInfo } from './types/user-location-info.type';

@Injectable()
export class LocationServiceImpl implements LocationService {
  constructor(
    @Inject('ViaCepService')
    private viaCepService: ViaCepService,
    @Inject('CachedGeocodingService')
    private geocodingService: GeocodingService,
    @Inject('CachedDistanceService')
    private distanceService: DistanceService,
  ) {}

  async getUserLocationFromCep(cep: string): Promise<UserLocationInfo> {
    const viaCepAddress = await this.viaCepService.getAddressFromCep(cep);
    const { logradouro, localidade, uf, cep: formattedCep } = viaCepAddress;

    const fullAddress = `${logradouro}, ${localidade}, ${uf}`;

    const userCoordinates = await this.geocodingService.getCoordinatesFromAddress(fullAddress);

    return {
      fullAddress,
      formattedCep,
      userCoordinates,
      locationInfo: viaCepAddress
    };
  }

  async calculateDistances(
    origins: { lat: number; lng: number },
    destinations: Array<{ lat: string; lng: string }>
  ) {
    return this.distanceService.calculateDistances(origins, destinations);
  }
} 