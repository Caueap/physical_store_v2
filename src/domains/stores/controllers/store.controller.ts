import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, Query, ValidationPipe } from '@nestjs/common';
import { StoreService } from '../service/store-service.interface';
import { CreateStoreDto } from '../dtos/create-store.dto';
import { UpdateStoreDto } from '../dtos/update-store.dto';

@Controller('stores')
export class StoreController {
  constructor(
    @Inject('StoreService')
    private readonly storeService: StoreService
  ) {}

  @Get()
  async getAllStores(@Query('limit') limit = 10, @Query('offset') offset = 0) {
    return this.storeService.getAllStores(+limit, +offset);
  }

  @Get('by-state/:state')
  async getStoresByState(
    @Param('state') state: string,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0
  ) {
    return this.storeService.getStoresByState(state, +limit, +offset);
  }

  @Get('by-cep/:cep')
  async getStoresByCep(
    @Param('cep') cep: string,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0
  ) {
    return this.storeService.getStoresByCep(cep, +limit, +offset);
  }

  @Get(':id')
  async getStoreById(@Param('id') id: string) {
    return this.storeService.getStoreById(id);
  }

  @Post()
  async createStore(
    @Body(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false
    })) 
    createStoreDto: CreateStoreDto
  ) {
    return this.storeService.createStore(createStoreDto);
  }

  @Put(':id')
  async updateStore(
    @Param('id') id: string,
    @Body(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false
    })) 
    updateStoreDto: UpdateStoreDto
  ) {
    return this.storeService.updateStore(id, updateStoreDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStore(@Param('id') id: string): Promise<void> {
    await this.storeService.deleteStore(id);
  }
} 