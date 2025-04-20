import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pdv, PdvSchema } from './entities/pdv.entity';
import { Store, StoreSchema } from '../stores/entities/store.entity';
import { PdvController } from './controllers/pdv.controller';
import { PdvServiceImpl } from './services/pdv.service.impl';
import { PdvRepositoryImpl } from '../../infrastructure/database/mongoose/pdv.repository.impl';
import { ProvidersModule } from '../../infrastructure/providers.module';

@Module({
  imports: [
    ProvidersModule,
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
  ],
  exports: ['PdvService'],
})
export class PdvsModule {} 