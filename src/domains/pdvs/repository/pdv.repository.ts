import { Types } from 'mongoose';
import { Pdv } from '../entities/pdv.entity';
import { CreatePdvDto } from '../dtos/create-pdv.dto';
import { UpdatePdvDto } from '../dtos/update-pdv.dto';

export interface PdvRepository {
  findAll(): Promise<Pdv[]>;
  findById(id: string | Types.ObjectId): Promise<Pdv | null>;
  findByState(state?: string, limit?: number, offset?: number): Promise<any>;
  findByStoreId(storeId: string | Types.ObjectId): Promise<Pdv[]>;
  create(createPdvDto: CreatePdvDto): Promise<Pdv>;
  update(id: string | Types.ObjectId, updatePdvDto: UpdatePdvDto): Promise<Pdv | null>;
  delete(id: string | Types.ObjectId): Promise<boolean>;
} 