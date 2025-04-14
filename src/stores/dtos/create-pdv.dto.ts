import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
  } from 'class-validator';
  import { StoreType } from './create-store.dto';
  
  export class CreatePdvDto {
    @IsString()
    @IsNotEmpty()
    storeName: string;
  
    @IsBoolean()
    takeOutInStore: boolean;
  
    @IsNumber()
    shippingTimeInDays: number;
  
    @IsEnum(StoreType)
    readonly type: StoreType = StoreType.PDV;
  
    @IsString()
    @IsNotEmpty()
    parentStoreId: string;
  
    @IsString()
    @IsNotEmpty()
    street: string;
  
    @IsString()
    @IsNotEmpty()
    number: string;
  
    @IsString()
    @IsOptional()
    complement?: string;
  
    @IsString()
    @IsNotEmpty()
    district: string;
  
    @IsString()
    @IsNotEmpty()
    city: string;
  
    @IsString()
    @IsNotEmpty()
    state: string;
  
    @IsString()
    @IsNotEmpty()
    postalCode: string;
  
    @IsString()
    @IsOptional()
    contactEmail?: string;
  
    @IsString()
    @IsOptional()
    contactPhone?: string;
  }