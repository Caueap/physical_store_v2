import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreController } from './controllers/store.controller';
import { StoreServiceImpl } from './service/store-service.impl';
import { Store, StoreSchema } from './entities/store.entity';
import { Pdv, PdvSchema } from '../pdvs/entities/pdv.entity';
import { StoreRepositoryImpl } from '../../infrastructure/database/mongoose/store.repository.impl';
import { ProvidersModule } from '../../infrastructure/providers.module';

@Module({
  imports: [
    ProvidersModule,
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
  ],
  exports: ['StoreService', 'StoreRepository'],
})
export class StoresModule {} 