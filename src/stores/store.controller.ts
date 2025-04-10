import { Controller, Get, Query, ValidationPipe, Post, Body } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dtos/create-store.dto';
import { GetAllStoresDto } from './dtos/get-all-stores.dto';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) { }

  @Get()
  async getAllStores(@Query(new ValidationPipe({ transform: true })) query: GetAllStoresDto) {
    const { limit = 10, offset = 0 } = query;
    return this.storeService.getAllStores(limit, offset);
  }

  @Post()
  async createStore(@Body() createStoreDto: CreateStoreDto) {
    return this.storeService.createStore(createStoreDto);
  }
}
