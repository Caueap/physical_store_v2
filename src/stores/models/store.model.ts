import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Store {
  @Prop({ required: true })
  storeName: string;

  @Prop({ required: true })
  takeOutInStore: boolean;

  @Prop({ required: true })
  shippingTimeInDays: number;

  @Prop()
  latitude: string;

  @Prop()
  longitude: string;

  @Prop()
  address1: string;

  @Prop()
  city: string;

  @Prop()
  district: string;

  @Prop()
  state: string;

  @Prop({ default: 'LOJA', enum: ['LOJA'] })
  type: string;

  @Prop()
  country: string;

  @Prop()
  postalCode: string;

  @Prop()
  telephoneNumber: string;

  @Prop()
  emailAddress: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Pdv' }] })
  pdvs: Types.ObjectId[];
}

export type StoreDocument = Store & Document;
export const StoreSchema = SchemaFactory.createForClass(Store);