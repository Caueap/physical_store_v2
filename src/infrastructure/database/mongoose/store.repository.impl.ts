import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StoreRepository } from '../../../domains/stores/repository/store-repository.interface';
import { Store, StoreDocument } from '../../../domains/stores/entities/store.entity';
import { PdvDocument } from '../../../domains/pdvs/entities/pdv.entity';
import { CreateStoreDto } from '../../../domains/stores/dtos/create-store.dto';
import { UpdateStoreDto } from '../../../domains/stores/dtos/update-store.dto';
import { paginate, getFullStateName } from '../../../utils/functions';
import { EntityNotFoundException, EntityRelationshipException } from '../../../common/exceptions/domain.exceptions';
import { DatabaseExceptionMapper } from '../../../common/exceptions/database.exceptions';

@Injectable()
export class StoreRepositoryImpl implements StoreRepository {
  constructor(
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
  ) {}

  async findAll(limit: number, offset: number): Promise<{ stores: Store[]; total: number }> {
    const allStores = await this.storeModel.find().populate({ path: 'pdvs', model: 'Pdv' }).exec();
    const paginatedStores = paginate(allStores, limit, offset);

    return {
      stores: paginatedStores,
      total: allStores.length,
    };
  }

  async findById(id: string): Promise<Store> {
    const store = await this.storeModel.findById(id).populate('pdvs').exec();
    if (!store) {
      throw new EntityNotFoundException('Store', id);
    }
    return store;
  }

  async findByState(state?: string, limit = 10, offset = 0): Promise<any> {
    if (state) {
      return this.findBySpecificState(state, limit, offset);
    } else {
      return this.findGroupedByState(limit, offset);
    }
  }

  private async findBySpecificState(state: string, limit: number, offset: number): Promise<any> {
    const fullStateName = getFullStateName(state);
    const filter = { state: new RegExp(`^${fullStateName}$`, 'i') };
    const stores = await this.storeModel.find(filter).populate('pdvs').exec();

    const paginatedStores = paginate(stores, limit, offset);

    return {
      state: fullStateName,
      total: stores.length,
      limit,
      offset,
      stores: paginatedStores,
    };
  }

  private async findGroupedByState(limit: number, offset: number): Promise<any> {
    const stores = await this.storeModel.find({}).exec();
    const grouped = this.groupStoresByState(stores);

    const paginatedStores: Record<string, any[]> = {};
    for (const [stateKey, list] of Object.entries(grouped)) {
      paginatedStores[stateKey] = paginate(list, limit, offset);
    }

    return {
      totalStates: Object.keys(grouped).length,
      limit,
      offset,
      groupedStores: paginatedStores,
    };
  }

  private groupStoresByState(stores: any[]): Record<string, any[]> {
    return stores.reduce((acc, store) => {
      const stateKey = store.state;
      if (!acc[stateKey]) {
        acc[stateKey] = [];
      }
      acc[stateKey].push(store);
      return acc;
    }, {} as Record<string, any[]>);
  }

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    return DatabaseExceptionMapper.executeOperation(async () => {
      return await this.storeModel.create({
        ...createStoreDto,
        type: 'LOJA',
      });
    }, 'Store');
  }

  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    return DatabaseExceptionMapper.executeOperation(async () => {
      const store = await this.storeModel.findByIdAndUpdate(id, updateStoreDto, { new: true }).exec();
      if (!store) {
        throw new EntityNotFoundException('Store', id);
      }
      return store;
    }, 'Store');
  }

  async delete(id: string): Promise<boolean> {
    const store = await this.storeModel.findById(id).exec();
    if (!store) {
      throw new EntityNotFoundException('Store', id);
    }
    
    
    if (store.pdvs && store.pdvs.length > 0) {
      try {
        
        const pdvModel = this.storeModel.db.model('Pdv');
        const pdvCount = await pdvModel.countDocuments({
          _id: { $in: store.pdvs }
        }).exec();
        
        if (pdvCount > 0) {
          throw new EntityRelationshipException(`Cannot delete Store with ID ${id} because it has ${pdvCount} associated PDVs`);
        }
        
        await this.storeModel.findByIdAndUpdate(id, { pdvs: [] }).exec();
      } catch (error) {
        if (error instanceof EntityRelationshipException) {
          throw error;
        }
        
        throw new EntityRelationshipException(`Cannot delete Store with ID ${id} because it has associated PDVs. Error: ${error.message}`);
      }
    }
    
    const result = await this.storeModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  async findAllWithPdvs(): Promise<Store[]> {
    return this.storeModel.find().populate<{ pdvs: PdvDocument[] }>({
      path: 'pdvs',
      model: 'Pdv'
    }).exec();
  }
} 