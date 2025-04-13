import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetStoresByStateDto {
  @IsOptional()
  @Matches(/^[a-zA-Z]{2}$/, {
    message: 'Please provide a state in UF format',
  })
  state?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1)
  @Max(100, { message: 'Limit must not be greater than 100' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Offset must be an integer' })
  @Min(0)
  offset?: number;
}