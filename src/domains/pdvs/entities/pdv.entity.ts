import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Store } from '../../stores/entities/store.entity'

export type PdvDocument = Pdv & Document;

@Schema()
export class Pdv {
  @Prop({ required: true, unique: true })
  storeName: string;

  @Prop({ default: true })
  takeOutInStore: boolean;

  @Prop({ default: 3 })
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

  @Prop({ default: 'PDV' })
  type: string;

  @Prop()
  country: string;

  @Prop()
  postalCode: string;

  @Prop({ type: Number })
  telephoneNumber: number;

  @Prop()
  emailAddress: string;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  store: Types.ObjectId | Store;
}

export const PdvSchema = SchemaFactory.createForClass(Pdv); 