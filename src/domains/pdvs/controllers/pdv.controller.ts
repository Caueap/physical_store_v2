import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, ValidationPipe, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { PdvService } from '../services/pdv.service';
import { CreatePdvDto } from '../dtos/create-pdv.dto';
import { UpdatePdvDto } from '../dtos/update-pdv.dto';
import { GetAllPdvsDto } from '../dtos/get-all-pdvs.dto';
import { GetPdvsByStateDto } from '../dtos/get-pdvs-by-state.dto';

@Controller('pdvs')
export class PdvController {
  constructor(
    @Inject('PdvService')
    private readonly pdvService: PdvService
  ) { }

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

  @Get('id/:id')
  async getPdvById(@Param('id') id: string) {
    return this.pdvService.getPdvById(id);
  }

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

  @Delete('id/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePdv(@Param('id') id: string): Promise<void> {
    await this.pdvService.delete(id);
  }
} 