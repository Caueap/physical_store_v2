import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, Query, ValidationPipe } from '@nestjs/common';
import { StoreService } from '../service/store-service.interface';
import { CreateStoreDto } from '../dtos/create-store.dto';
import { UpdateStoreDto } from '../dtos/update-store.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Store } from '../entities/store.entity';

@ApiTags('stores')
@Controller('stores')
export class StoreController {
  constructor(
    @Inject('StoreService')
    private readonly storeService: StoreService
  ) {}

  @ApiOperation({ summary: 'Get all stores', description: 'Retrieves a paginated list of all stores' })
  @ApiQuery({ name: 'limit', description: 'Number of stores to return', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'offset', description: 'Number of stores to skip', type: Number, required: false, example: 0 })
  @ApiResponse({ status: 200, description: 'List of stores retrieved successfully', type: [Store] })
  @Get()
  async getAllStores(@Query('limit') limit = 10, @Query('offset') offset = 0) {
    return this.storeService.getAllStores(+limit, +offset);
  }

  @ApiOperation({ summary: 'Get stores by state', description: 'Retrieves stores filtered by state' })
  @ApiParam({ name: 'state', description: 'State code (e.g. SP, RJ)', example: 'SP' })
  @ApiQuery({ name: 'limit', description: 'Number of stores to return', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'offset', description: 'Number of stores to skip', type: Number, required: false, example: 0 })
  @ApiResponse({ status: 200, description: 'List of stores retrieved successfully', type: [Store] })
  @Get('by-state/:state')
  async getStoresByState(
    @Param('state') state: string,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0
  ) {
    return this.storeService.getStoresByState(state, +limit, +offset);
  }

  @ApiOperation({ summary: 'Get stores by postal code', description: 'Retrieves stores filtered by postal code' })
  @ApiParam({ name: 'cep', description: 'Postal code (CEP)', example: '04023-900' })
  @ApiQuery({ name: 'limit', description: 'Number of stores to return', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'offset', description: 'Number of stores to skip', type: Number, required: false, example: 0 })
  @ApiResponse({ status: 200, description: 'List of stores retrieved successfully', type: [Store] })
  @Get('by-cep/:cep')
  async getStoresByCep(
    @Param('cep') cep: string,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0
  ) {
    return this.storeService.getStoresByCep(cep, +limit, +offset);
  }

  @ApiOperation({ summary: 'Get store by ID', description: 'Retrieves a specific store by its ID' })
  @ApiParam({ name: 'id', description: 'Store ID', example: '60a1e2c5c5e4b02f68c15a1c' })
  @ApiResponse({ status: 200, description: 'Store retrieved successfully', type: Store })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @Get(':id')
  async getStoreById(@Param('id') id: string) {
    return this.storeService.getStoreById(id);
  }

  @ApiOperation({ summary: 'Create store', description: 'Creates a new store' })
  @ApiResponse({ status: 201, description: 'Store successfully created', type: Store })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Update store', description: 'Updates an existing store by ID' })
  @ApiParam({ name: 'id', description: 'Store ID', example: '60a1e2c5c5e4b02f68c15a1c' })
  @ApiResponse({ status: 200, description: 'Store successfully updated', type: Store })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Delete store', description: 'Deletes a store by ID' })
  @ApiParam({ name: 'id', description: 'Store ID', example: '60a1e2c5c5e4b02f68c15a1c' })
  @ApiResponse({ status: 204, description: 'Store successfully deleted' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStore(@Param('id') id: string): Promise<void> {
    await this.storeService.deleteStore(id);
  }
} 