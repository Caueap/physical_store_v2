import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { Store, StoreSchema } from './models/store.model';
import { Pdv, PdvSchema } from './models/pdv.model';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Store.name, schema: StoreSchema },
      { name: Pdv.name, schema: PdvSchema },
    ]),
  ],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule { }