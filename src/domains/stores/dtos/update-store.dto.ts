import { IsBoolean, IsEmail, IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStoreDto {
  @ApiProperty({ description: 'The name of the store', example: 'Updated Store Name', required: false })
  @IsOptional()
  @IsString()
  storeName?: string;

  @ApiProperty({ description: 'Flag indicating if in-store pickup is available', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  takeOutInStore?: boolean;

  @ApiProperty({ description: 'Number of days for shipping', default: 2, required: false })
  @IsOptional()
  @IsNumber()
  shippingTimeInDays?: number;

  @ApiProperty({ description: 'Latitude coordinates of the store', example: -23.5505, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiProperty({ description: 'Longitude coordinates of the store', example: -46.6333, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({ description: 'Store address', example: '123 Main St', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'City where the store is located', example: 'São Paulo', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'District where the store is located', example: 'Vila Mariana', required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ description: 'State where the store is located', example: 'SP', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Country where the store is located', example: 'Brazil', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Postal code of the store', example: '04023-900', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ description: 'Store telephone number', example: 1123456789, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  telephoneNumber?: number;

  @ApiProperty({ description: 'Store email address', example: 'store@example.com', required: false })
  @IsOptional()
  @IsEmail()
  emailAddress?: string;
} 