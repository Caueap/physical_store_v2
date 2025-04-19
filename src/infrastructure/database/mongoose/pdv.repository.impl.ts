import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Pdv } from '../../../domains/pdvs/entities/pdv.entity';
import { PdvRepository } from '../../../domains/pdvs/repository/pdv.repository';
import { Store } from '../../../domains/stores/entities/store.entity';
import { getFullStateName } from 'src/utils/functions';
import { paginate } from 'src/utils/functions';

@Injectable()
export class PdvRepositoryImpl implements PdvRepository {
  constructor(
    @InjectModel(Pdv.name) private pdvModel: Model<Pdv>,
    @InjectModel(Store.name) private storeModel: Model<Store>,
  ) {}

  async findAll(): Promise<Pdv[]> {
    return this.pdvModel.find().exec();
  }

  async findById(id: string | Types.ObjectId): Promise<Pdv | null> {
    return this.pdvModel.findById(id).exec();
  }


  async findByStoreId(storeId: string | Types.ObjectId): Promise<Pdv[]> {
    return this.pdvModel.find({ storeId }).exec();
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
    const pdvs = await this.pdvModel.find(filter).exec();

    const paginatedPdvs = paginate(pdvs, limit, offset);

    return {
      state: fullStateName,
      total: pdvs.length,
      limit,
      offset,
      pdvs: paginatedPdvs,
    };
  }

  private async findGroupedByState(limit: number, offset: number): Promise<any> {
    const pdvs = await this.pdvModel.find({}).exec();
    const grouped = this.groupPdvsByState(pdvs);

    const paginatedPdvs: Record<string, any[]> = {};
    for (const [stateKey, list] of Object.entries(grouped)) {
      paginatedPdvs[stateKey] = paginate(list, limit, offset);
    }

    return {
      totalStates: Object.keys(grouped).length,
      limit,
      offset,
      groupedPdvs: paginatedPdvs,
    };
  }

  private groupPdvsByState(pdvs: any[]): Record<string, any[]> {
    return pdvs.reduce((acc, pdv) => {
      const stateKey = pdv.state;
      if (!acc[stateKey]) {
        acc[stateKey] = [];
      }
      acc[stateKey].push(pdv);
      return acc;
    }, {} as Record<string, any[]>);
  }

 

  async create(pdv: Partial<Pdv>): Promise<Pdv> {
    const newPdv = new this.pdvModel(pdv);
    const savedPdv = await newPdv.save();
    
    await this.storeModel.findByIdAndUpdate(
      pdv.store,
      { $push: { pdvs: savedPdv._id } }
    );
    
    return savedPdv;
  }

  async update(id: string | Types.ObjectId, pdv: Partial<Pdv>): Promise<Pdv | null> {
    return this.pdvModel.findByIdAndUpdate(id, pdv, { new: true }).exec();
  }

  async delete(id: string | Types.ObjectId): Promise<boolean> {
    const pdv = await this.pdvModel.findById(id);
    if (!pdv) return false;
    
    await this.storeModel.findByIdAndUpdate(
      pdv.store,
      { $pull: { pdvs: pdv._id } }
    );
    
    const result = await this.pdvModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }
} 