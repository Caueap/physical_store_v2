import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Store, StoreDocument } from './models/store.model';
import { CreateStoreDto } from './dtos/create-store.dto';
import { getFullStateName } from '../utils/functions';
import { paginate } from 'src/utils/functions';
import { lastValueFrom } from 'rxjs';
import { CreatePdvDto } from './dtos/create-pdv.dto';
import { Pdv, PdvDocument } from './models/pdv.model';

@Injectable()
export class StoreService {
  constructor(
    @InjectModel(Store.name) private StoreModel: Model<StoreDocument>,
    @InjectModel(Pdv.name) private PdvModel: Model<PdvDocument>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) { }

  async getAllStores(limit: number, offset: number): Promise<any> {
    const allStores = await this.StoreModel.find().populate({ path: 'pdvs', model: 'Pdv' }).exec();
    const paginatedStores = paginate(allStores, limit, offset);

    return {
      stores: paginatedStores,
      limit,
      offset,
      total: allStores.length,
    };
  }

  async getStoresByState(state?: string, limit = 10, offset = 0): Promise<any> {
    if (state) {
      return await this.getStoresBySpecificState(state, limit, offset);
    } else {
      return await this.getStoresGroupedByState(limit, offset);
    }
  }

  private async getStoresBySpecificState(state: string, limit: number, offset: number): Promise<any> {
    const fullStateName = getFullStateName(state);
    if (!fullStateName) {
      throw new BadRequestException('Invalid state abbreviation');
    }

    const filter = { state: new RegExp(`^${fullStateName}$`, 'i') };
    const stores = await this.StoreModel.find(filter).populate('pdvs').exec();

    if (!stores || stores.length === 0) {
      throw new NotFoundException(`No stores found in state ${fullStateName}`);
    }

    const paginatedStores = paginate(stores, limit, offset);

    return {
      state: fullStateName,
      total: stores.length,
      limit,
      offset,
      stores: paginatedStores,
    };
  }

  private async getStoresGroupedByState(limit: number, offset: number): Promise<any> {
    const stores = await this.StoreModel.find({}).exec();

    if (!stores || stores.length === 0) {
      throw new NotFoundException('No stores found');
    }

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
      const stateKey = (store.state);
      if (!acc[stateKey]) {
        acc[stateKey] = [];
      }
      acc[stateKey].push(store);
      return acc;
    }, {} as Record<string, any[]>);
  }

  async getStoreById(id: string): Promise<Store> {
    const store = await this.StoreModel.findById(id).populate('pdvs').exec();
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async createStore(dto: CreateStoreDto) {
    return this.StoreModel.create({
      ...dto,
      type: 'LOJA',
    });
  }

  async createPdv(dto: CreatePdvDto) {
    const parent = await this.StoreModel.findById(dto.parentStoreId);
    if (!parent || parent.type !== 'LOJA') {
      throw new BadRequestException('Invalid or non-store parentStoreId');
    }

    const pdv = await this.PdvModel.create({
      ...dto,
      store: dto.parentStoreId,
      type: 'PDV',
    });

    parent.pdvs.push(pdv._id as Types.ObjectId);
    await parent.save();

    return pdv;
  }
}