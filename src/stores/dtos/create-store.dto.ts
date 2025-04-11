import { IsString, IsBoolean, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  storeName: string;

  @IsBoolean()
  takeOutInStore: boolean;

  @IsNumber()
  shippingTimeInDays: number;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  longitude?: string;

  @IsOptional()
  @IsString()
  address1?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsIn(['PDV', 'LOJA'])
  type?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  telephoneNumber?: string;

  @IsOptional()
  @IsString()
  emailAddress?: string;
}
