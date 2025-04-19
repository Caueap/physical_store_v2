import { Types } from 'mongoose';
import { Pdv } from '../entities/pdv.entity';
import { CreatePdvDto } from '../dtos/create-pdv.dto';
import { UpdatePdvDto } from '../dtos/update-pdv.dto';

export interface PdvService {
  
  createPdv(createPdvDto: CreatePdvDto): Promise<Pdv>;
  update(id: string | Types.ObjectId, updatePdvDto: UpdatePdvDto): Promise<Pdv>;
  delete(id: string | Types.ObjectId): Promise<boolean>;
  getAllPdvs(limit: number, offset: number): Promise<{ pdvs: Pdv[], limit: number, offset: number, total: number }>;
  getAllPdvsByState(state?: string, limit?: number, offset?: number): Promise<{ pdvs: Pdv[], limit: number, offset: number, total: number }>;
  getPdvById(id: string): Promise<Pdv>;
  getPdvsByCep(cep: string, limit?: number, offset?: number): Promise<{ pdvs: any[], pins: any[], limit: number, offset: number, total: number }>;
} 