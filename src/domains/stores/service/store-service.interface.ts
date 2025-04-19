import { Store } from '../entities/store.entity';
import { CreateStoreDto } from '../dtos/create-store.dto';
import { UpdateStoreDto } from '../dtos/update-store.dto';
import { StoresByCepResponse } from '../types/stores-by-cep-response.interface';

export interface StoreService {
  getAllStores(limit: number, offset: number): Promise<{ stores: any[], limit: number, offset: number, total: number }>;
  getStoreById(id: string): Promise<Store>;
  getStoresByState(state?: string, limit?: number, offset?: number): Promise<any>;
  getStoresByCep(cep: string, limit?: number, offset?: number): Promise<StoresByCepResponse>;
  createStore(createStoreDto: CreateStoreDto): Promise<Store>;
  updateStore(id: string, updateStoreDto: UpdateStoreDto): Promise<Store>;
  deleteStore(id: string): Promise<boolean>;
} 