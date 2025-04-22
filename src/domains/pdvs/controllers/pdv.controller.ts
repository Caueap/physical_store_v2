import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, ValidationPipe, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { PdvService } from '../services/pdv.service';
import { CreatePdvDto } from '../dtos/create-pdv.dto';
import { UpdatePdvDto } from '../dtos/update-pdv.dto';
import { GetAllPdvsDto } from '../dtos/get-all-pdvs.dto';
import { GetPdvsByStateDto } from '../dtos/get-pdvs-by-state.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Pdv } from '../entities/pdv.entity';

@ApiTags('pdvs')
@Controller('pdvs')
export class PdvController {
  constructor(
    @Inject('PdvService')
    private readonly pdvService: PdvService
  ) { }

  @ApiOperation({ summary: 'Get all PDVs', description: 'Retrieves a paginated list of all PDVs' })
  @ApiQuery({ name: 'limit', description: 'Number of PDVs to return', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'offset', description: 'Number of PDVs to skip', type: Number, required: false, example: 0 })
  @ApiResponse({ status: 200, description: 'List of PDVs retrieved successfully', type: [Pdv] })
  @Get()
  async getAllPdvs(
    @Query(new ValidationPipe({ 
      transform: true, 
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
      whitelist: true,
      skipMissingProperties: true,
    })) 
    query: GetAllPdvsDto = {}
  ) {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    return this.pdvService.getAllPdvs(limit, offset);
  }

  @ApiOperation({ summary: 'Get PDVs by state', description: 'Retrieves PDVs filtered by state' })
  @ApiParam({ name: 'state', description: 'State code (e.g. SP, RJ)', example: 'SP' })
  @ApiQuery({ name: 'limit', description: 'Number of PDVs to return', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'offset', description: 'Number of PDVs to skip', type: Number, required: false, example: 0 })
  @ApiResponse({ status: 200, description: 'List of PDVs retrieved successfully', type: [Pdv] })
  @ApiResponse({ status: 400, description: 'Bad request - state is required' })
  @Get('by-state/:state')
  async getPdvsByState(
    @Param('state') state: string,
    @Query(new ValidationPipe({ 
      transform: true, 
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
      whitelist: true,
      skipMissingProperties: true,
    })) 
    query: GetPdvsByStateDto = {}
  ) {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;

    if (!state || state.trim() === '') {
      throw new BadRequestException('Please, provide a state');
    }

    return this.pdvService.getAllPdvsByState(state, limit, offset);
  }

  @ApiOperation({ summary: 'Get PDVs by postal code', description: 'Retrieves PDVs filtered by postal code' })
  @ApiParam({ name: 'cep', description: 'Postal code (CEP)', example: '04023-900' })
  @ApiQuery({ name: 'limit', description: 'Number of PDVs to return', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'offset', description: 'Number of PDVs to skip', type: Number, required: false, example: 0 })
  @ApiResponse({ status: 200, description: 'List of PDVs retrieved successfully', type: [Pdv] })
  @Get('by-cep/:cep')
  async getPdvsByCep(
    @Param('cep') cep: string,
    @Query(new ValidationPipe({ 
      transform: true, 
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
      whitelist: true,
      skipMissingProperties: true,
    })) 
    query: GetAllPdvsDto = {}
  ) {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    return this.pdvService.getPdvsByCep(cep, limit, offset);
  }

  @ApiOperation({ summary: 'Get PDV by ID', description: 'Retrieves a specific PDV by its ID' })
  @ApiParam({ name: 'id', description: 'PDV ID', example: '60a1e2c5c5e4b02f68c15a1c' })
  @ApiResponse({ status: 200, description: 'PDV retrieved successfully', type: Pdv })
  @ApiResponse({ status: 404, description: 'PDV not found' })
  @Get('id/:id')
  async getPdvById(@Param('id') id: string) {
    return this.pdvService.getPdvById(id);
  }

  @ApiOperation({ summary: 'Create PDV', description: 'Creates a new PDV' })
  @ApiBody({ type: CreatePdvDto })
  @ApiResponse({ status: 201, description: 'PDV successfully created', type: Pdv })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  createPdv(
    @Body(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false
    })) 
    dto: CreatePdvDto
  ) {
    return this.pdvService.createPdv(dto);
  }

  @ApiOperation({ summary: 'Update PDV', description: 'Updates an existing PDV by ID' })
  @ApiParam({ name: 'id', description: 'PDV ID', example: '60a1e2c5c5e4b02f68c15a1c' })
  @ApiBody({ type: UpdatePdvDto })
  @ApiResponse({ status: 200, description: 'PDV successfully updated', type: Pdv })
  @ApiResponse({ status: 404, description: 'PDV not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put('id/:id')
  updatePdv(
    @Param('id') id: string,
    @Body(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false
    }))
    dto: UpdatePdvDto,
  ) {
    return this.pdvService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete PDV', description: 'Deletes a PDV by ID' })
  @ApiParam({ name: 'id', description: 'PDV ID', example: '60a1e2c5c5e4b02f68c15a1c' })
  @ApiResponse({ status: 204, description: 'PDV successfully deleted' })
  @ApiResponse({ status: 404, description: 'PDV not found' })
  @Delete('id/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePdv(@Param('id') id: string): Promise<void> {
    await this.pdvService.delete(id);
  }
} 