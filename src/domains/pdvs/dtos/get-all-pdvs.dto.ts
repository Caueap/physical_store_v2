import { IsInt, IsOptional, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetAllPdvsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10) || 10)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10) || 0)
  offset?: number;
} 