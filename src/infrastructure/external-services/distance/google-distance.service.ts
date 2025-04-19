import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { Coordinates } from '../geocoding/types/coordinates.type';
import { DistanceService } from './interfaces/distance-service.interface';
import { DistanceResult } from './types/distance-result.type';

@Injectable()
export class GoogleDistanceService implements DistanceService {
  private readonly GOOGLE_API_KEY: string | undefined;
  private readonly GOOGLE_DISTANCE_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.GOOGLE_API_KEY = this.configService.get<string>('GOOGLE_API_KEY');
  }

  async calculateDistances(
    origin: Coordinates,
    destinations: Array<{ lat: string; lng: string }>,
  ): Promise<DistanceResult[]> {
    
    const destinationsStr = destinations.map(point => `${point.lat},${point.lng}`).join('|');
    const originsStr = `${origin.lat},${origin.lng}`;
    const distanceMatrixUrl = `${this.GOOGLE_DISTANCE_API_URL}?origins=${originsStr}&destinations=${destinationsStr}&mode=driving&key=${this.GOOGLE_API_KEY}`;

    const distanceResponse = await lastValueFrom(this.httpService.get(distanceMatrixUrl));
    const distances = distanceResponse.data.rows[0]?.elements;

    if (!distances || distances.length !== destinations.length) {
      throw new InternalServerErrorException('Error fetching distances');
    }

    return distances.map(item => ({
      distance: item.distance?.text || 'N/A',
      duration: item.duration?.text || 'N/A',
      distanceValue: item.distance?.value || 0
    }));
  }
} 