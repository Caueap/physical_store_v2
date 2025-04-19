import { Store } from '../entities/store.entity';
import { Pdv } from '../../pdvs/entities/pdv.entity';
import { CreateStoreDto } from '../dtos/create-store.dto';
import { UpdateStoreDto } from '../dtos/update-store.dto';

export interface StoreRepository {
  findAll(limit: number, offset: number): Promise<{ stores: Store[], total: number }>;
  findById(id: string): Promise<Store>;
  findByState(state?: string, limit?: number, offset?: number): Promise<any>;
  create(createStoreDto: CreateStoreDto): Promise<Store>;
  update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store>;
  delete(id: string): Promise<boolean>;
  findAllWithPdvs(): Promise<Store[]>;
} 