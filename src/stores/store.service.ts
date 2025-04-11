import { Injectable, NotFoundException } from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Store, StoreDocument } from './schemas/store.schema';
import { CreateStoreDto } from './dtos/create-store.dto';

@Injectable()
export class StoreService {
  constructor(
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
    private httpService: HttpService,
  ) {}

 
  async getAllStores(limit: number, offset: number): Promise<any> {
    const stores = await this.storeModel.find().skip(offset).limit(limit).exec();
    const total = await this.storeModel.countDocuments();
    return {
      stores,
      limit,
      offset,
      total,
    };
  }

  async getStoreById(id: string): Promise<Store> {
    const store = await this.storeModel.findById(id);
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async createStore(createStoreDto: CreateStoreDto): Promise<Store> {
    const createdStore = new this.storeModel(createStoreDto);
    return createdStore.save();
  }
}
