import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoreDocument = Store & Document;

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
  address2: string;

  @Prop()
  address3: string;

  @Prop()
  city: string;

  @Prop()
  district: string;

  @Prop()
  state: string;

  @Prop({ enum: ['PDV', 'LOJA'] })
  type: string;

  @Prop()
  country: string;

  @Prop()
  postalCode: string;

  @Prop()
  telephoneNumber: string;

  @Prop()
  emailAddress: string;
}

export const StoreSchema = SchemaFactory.createForClass(Store);