import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Pdv } from '../../pdvs/entities/pdv.entity';

export type StoreDocument = Store & Document;

@Schema()
export class Store {
  @Prop({ required: true, unique: true })
  storeName: string;

  @Prop({ default: true })
  takeOutInStore: boolean;

  @Prop({ default: 2 })
  shippingTimeInDays: number;

  @Prop({ type: Number })
  latitude: number;

  @Prop({ type: Number })
  longitude: number;

  @Prop()
  address: string;

  @Prop()
  city: string;

  @Prop()
  district: string;

  @Prop()
  state: string;

  @Prop({ default: 'LOJA' })
  type: string;

  @Prop()
  country: string;

  @Prop()
  postalCode: string;

  @Prop()
  telephoneNumber: number;

  @Prop()
  emailAddress: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Pdv' }], default: [] })
  pdvs: Types.ObjectId[] | Pdv[];
}

export const StoreSchema = SchemaFactory.createForClass(Store); 