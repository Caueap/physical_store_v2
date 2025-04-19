import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreController } from './controllers/store.controller';
import { StoreServiceImpl } from './service/store-service.impl';
import { Store, StoreSchema } from './entities/store.entity';
import { Pdv, PdvSchema } from '../pdvs/entities/pdv.entity';
import { StoreRepositoryImpl } from '../../infrastructure/database/mongoose/store.repository.impl';
import { MelhorEnvioShippingService } from '../../infrastructure/external-services/shipping/melhor-envio.service';
import { GoogleGeocodingService } from '../../infrastructure/external-services/geocoding/google-geocoding.service';
import { GoogleDistanceService } from '../../infrastructure/external-services/distance/google-distance.service';
import { ViaCepServiceImpl } from '../../infrastructure/external-services/viacep/viacep.service';
import { LocationServiceImpl } from '../../infrastructure/external-services/location/location-service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Store.name, schema: StoreSchema },
      { name: Pdv.name, schema: PdvSchema },
    ]),
  ],
  controllers: [StoreController],
  providers: [
    {
      provide: 'StoreService',
      useClass: StoreServiceImpl,
    },
    {
      provide: 'StoreRepository',
      useClass: StoreRepositoryImpl,
    },
    {
      provide: 'ShippingService',
      useClass: MelhorEnvioShippingService,
    },
    {
      provide: 'GeocodingService',
      useClass: GoogleGeocodingService,
    },
    {
      provide: 'DistanceService',
      useClass: GoogleDistanceService,
    },
    {
      provide: 'ViaCepService',
      useClass: ViaCepServiceImpl,
    },
    {
      provide: 'LocationService',
      useClass: LocationServiceImpl,
    },
  ],
  exports: ['StoreService', 'StoreRepository'],
})
export class StoresModule {} 