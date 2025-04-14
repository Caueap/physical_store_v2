import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Pdv {
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

  @Prop({ default: 'PDV', enum: ['PDV'] })
  type: string;

  @Prop()
  country: string;

  @Prop()
  postalCode: string;

  @Prop()
  telephoneNumber: string;

  @Prop()
  emailAddress: string;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  store: Types.ObjectId;
}

export type PdvDocument = Pdv & Document;
export const PdvSchema = SchemaFactory.createForClass(Pdv);