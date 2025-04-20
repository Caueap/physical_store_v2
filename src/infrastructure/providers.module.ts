import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoogleDistanceService } from './external-services/distance/google-distance.service';
import { CachedDistanceService } from './external-services/distance/cached-distance.service';
import { GoogleGeocodingService } from './external-services/geocoding/google-geocoding.service';
import { CachedGeocodingService } from './external-services/geocoding/cached-geocoding.service';
import { MelhorEnvioShippingService } from './external-services/shipping/melhor-envio.service';
import { CachedShippingService } from './external-services/shipping/cached-shipping.service';
import { LocationServiceImpl } from './external-services/location/location-service';
import { CachedLocationServiceImpl } from './external-services/location/cached-location-service';
import { CacheModule } from '../common/cache/cache.module';
import { ViaCepServiceImpl } from './external-services/viacep/viacep.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    CacheModule,
  ],
  providers: [
    {
      provide: 'DistanceService',
      useClass: GoogleDistanceService,
    },
    {
      provide: 'GeocodingService',
      useClass: GoogleGeocodingService,
    },
    {
      provide: 'ShippingService',
      useClass: MelhorEnvioShippingService,
    },
    {
      provide: 'ViaCepService',
      useClass: ViaCepServiceImpl,
    },
    CachedDistanceService,
    CachedGeocodingService,
    CachedShippingService,
    CachedDistanceService,
    {
      provide: 'CachedDistanceService',
      useClass: CachedDistanceService,
    },
    {
      provide: 'CachedGeocodingService',
      useClass: CachedGeocodingService,
    },
    {
      provide: 'CachedShippingService',
      useClass: CachedShippingService,
    },
    LocationServiceImpl,
    CachedLocationServiceImpl,
    {
      provide: 'LocationService',
      useClass: CachedLocationServiceImpl,
    },
  ],
  exports: [
    'DistanceService',
    'GeocodingService',
    'ShippingService',
    'CachedDistanceService',
    'CachedGeocodingService',
    'CachedShippingService',
    'LocationService',
    'ViaCepService',
    HttpModule,
  ],
})
export class ProvidersModule {} 