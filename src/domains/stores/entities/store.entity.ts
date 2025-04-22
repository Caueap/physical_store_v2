import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Pdv } from '../../pdvs/entities/pdv.entity';
import { ApiProperty } from '@nestjs/swagger';

export type StoreDocument = Store & Document;

@Schema()
export class Store {
  @ApiProperty({ description: 'The name of the store', example: 'Main Street Store' })
  @Prop({ required: true, unique: true })
  storeName: string;

  @ApiProperty({ description: 'Flag indicating if in-store pickup is available', default: true })
  @Prop({ default: true })
  takeOutInStore: boolean;

  @ApiProperty({ description: 'Number of days for shipping', default: 2 })
  @Prop({ default: 2 })
  shippingTimeInDays: number;

  @ApiProperty({ description: 'Latitude coordinates of the store', example: -23.5505 })
  @Prop({ type: Number })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinates of the store', example: -46.6333 })
  @Prop({ type: Number })
  longitude: number;

  @ApiProperty({ description: 'Store address', example: '123 Main St' })
  @Prop()
  address: string;

  @ApiProperty({ description: 'City where the store is located', example: 'São Paulo' })
  @Prop()
  city: string;

  @ApiProperty({ description: 'District where the store is located', example: 'Vila Mariana' })
  @Prop()
  district: string;

  @ApiProperty({ description: 'State where the store is located', example: 'SP' })
  @Prop()
  state: string;

  @ApiProperty({ description: 'Type of the location', default: 'LOJA' })
  @Prop({ default: 'LOJA' })
  type: string;

  @ApiProperty({ description: 'Country where the store is located', example: 'Brazil' })
  @Prop()
  country: string;

  @ApiProperty({ description: 'Postal code of the store', example: '04023-900' })
  @Prop()
  postalCode: string;

  @ApiProperty({ description: 'Store telephone number', example: 1123456789 })
  @Prop()
  telephoneNumber: number;

  @ApiProperty({ description: 'Store email address', example: 'store@example.com' })
  @Prop()
  emailAddress: string;

  @ApiProperty({ description: 'List of PDVs associated with this store', type: [String] })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Pdv' }], default: [] })
  pdvs: Types.ObjectId[] | Pdv[];
}

export const StoreSchema = SchemaFactory.createForClass(Store); 