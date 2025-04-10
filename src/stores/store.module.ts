import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { Store, StoreSchema } from './schemas/store.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }]),
  ],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule { }
