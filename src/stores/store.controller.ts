import { Controller, Get, Query, Param, ValidationPipe, Post, Body, BadRequestException } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dtos/create-store.dto';
import { GetAllStoresDto } from './dtos/get-all-stores.dto';
import { GetStoresByStateDto } from './dtos/get-stores-by-states.dto';
import { CreatePdvDto } from './dtos/create-pdv.dto';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) { }

  @Get()
  async getAllStores(@Query(new ValidationPipe({ transform: true })) query: GetAllStoresDto) {
    const { limit = 10, offset = 0 } = query;
    return this.storeService.getAllStores(limit, offset);
  }

  @Get('by-cep/:cep')
  async getStoresByCep(@Param('cep') cep: string) {
    return this.storeService.getStoresByCep(cep);
  }

  @Get('stores-by-state')
  async getStoresByState(
    @Query(new ValidationPipe({ transform: true })) query: GetStoresByStateDto,
  ) {
    const { state, limit = 10, offset = 0 } = query;

    if (state && state.trim() === '') {
      throw new BadRequestException('Please, provide a state');
    }

    return this.storeService.getStoresByState(state, limit, offset);
  }

  @Get('id/:id')
  async getStoreById(@Param('id') id: string) {
    return this.storeService.getStoreById(id);
  }

  @Post()
  createStore(@Body() dto: CreateStoreDto) {
    return this.storeService.createStore(dto);
  }

  @Post('pdv')
  createPdv(@Body() dto: CreatePdvDto) {
    return this.storeService.createPdv(dto);
  }
}