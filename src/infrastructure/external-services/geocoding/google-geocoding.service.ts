import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { GeocodingService } from './interfaces/geocoding-service.interface';
import { Coordinates } from './types/coordinates.type';

@Injectable()
export class GoogleGeocodingService implements GeocodingService {
  private readonly GOOGLE_API_KEY: string | undefined;
  private readonly GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.GOOGLE_API_KEY = this.configService.get<string>('GOOGLE_API_KEY');
  }

  async getCoordinatesFromAddress(address: string): Promise<Coordinates> {
    const geocodingUrl = `${this.GOOGLE_GEOCODING_API_URL}?address=${encodeURIComponent(address)}&key=${this.GOOGLE_API_KEY}`;
    const geocodeResponse = await lastValueFrom(this.httpService.get(geocodingUrl));
    const location = geocodeResponse.data.results?.[0]?.geometry?.location;

    if (!location) {
      throw new BadRequestException('Could not geocode the address');
    }

    return {
      lat: location.lat,
      lng: location.lng
    };
  }
} 