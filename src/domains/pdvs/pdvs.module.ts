import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pdv, PdvSchema } from './entities/pdv.entity';
import { Store, StoreSchema } from '../stores/entities/store.entity';
import { PdvController } from './controllers/pdv.controller';
import { PdvServiceImpl } from './services/pdv.service.impl';
import { PdvRepositoryImpl } from '../../infrastructure/database/mongoose/pdv.repository.impl';
import { MelhorEnvioShippingService } from '../../infrastructure/external-services/shipping/melhor-envio.service';
import { LocationServiceImpl } from '../../infrastructure/external-services/location/location-service';
import { GoogleGeocodingService } from '../../infrastructure/external-services/geocoding/google-geocoding.service';
import { ViaCepServiceImpl } from '../../infrastructure/external-services/viacep/viacep.service';
import { GoogleDistanceService } from '../../infrastructure/external-services/distance/google-distance.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Pdv.name, schema: PdvSchema },
      { name: Store.name, schema: StoreSchema },
    ]),
  ],
  controllers: [PdvController],
  providers: [
    {
      provide: 'PdvService',
      useClass: PdvServiceImpl,
    },
    {
      provide: 'PdvRepository',
      useClass: PdvRepositoryImpl,
    },
    {
      provide: 'ShippingService',
      useClass: MelhorEnvioShippingService,
    },
    {
      provide: 'LocationService',
      useClass: LocationServiceImpl,
    },
    {
      provide: 'GeocodingService',
      useClass: GoogleGeocodingService,
    },
    {
      provide: 'ViaCepService',
      useClass: ViaCepServiceImpl,
    },
    {
      provide: 'DistanceService',
      useClass: GoogleDistanceService,
    },
  ],
  exports: ['PdvService'],
})
export class PdvsModule {} 