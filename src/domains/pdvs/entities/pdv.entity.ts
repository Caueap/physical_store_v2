import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Store } from '../../stores/entities/store.entity'
import { ApiProperty } from '@nestjs/swagger';

export type PdvDocument = Pdv & Document;

@Schema()
export class Pdv {
  @ApiProperty({ description: 'The name of the PDV', example: 'Main Street PDV' })
  @Prop({ required: true, unique: true })
  storeName: string;

  @ApiProperty({ description: 'Flag indicating if in-store pickup is available', default: true })
  @Prop({ default: true })
  takeOutInStore: boolean;

  @ApiProperty({ description: 'Number of days for shipping', default: 3 })
  @Prop({ default: 3 })
  shippingTimeInDays: number;

  @ApiProperty({ description: 'Latitude coordinates of the PDV', example: -23.5505 })
  @Prop({ type: Number })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinates of the PDV', example: -46.6333 })
  @Prop({ type: Number })
  longitude: number;

  @ApiProperty({ description: 'PDV address', example: '123 Main St' })
  @Prop()
  address: string;

  @ApiProperty({ description: 'City where the PDV is located', example: 'São Paulo' })
  @Prop()
  city: string;

  @ApiProperty({ description: 'District where the PDV is located', example: 'Vila Mariana' })
  @Prop()
  district: string;

  @ApiProperty({ description: 'State where the PDV is located', example: 'SP' })
  @Prop()
  state: string;

  @ApiProperty({ description: 'Type of the location', default: 'PDV' })
  @Prop({ default: 'PDV' })
  type: string;

  @ApiProperty({ description: 'Country where the PDV is located', example: 'Brazil' })
  @Prop()
  country: string;

  @ApiProperty({ description: 'Postal code of the PDV', example: '04023-900' })
  @Prop()
  postalCode: string;

  @ApiProperty({ description: 'PDV telephone number', example: 1123456789 })
  @Prop({ type: Number })
  telephoneNumber: number;

  @ApiProperty({ description: 'PDV email address', example: 'pdv@example.com' })
  @Prop()
  emailAddress: string;

  @ApiProperty({ description: 'The store that this PDV belongs to', type: String })
  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  store: Types.ObjectId | Store;
}

export const PdvSchema = SchemaFactory.createForClass(Pdv); 