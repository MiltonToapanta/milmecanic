import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ToBoolean } from './inventory-query-utils';

export class SimpleInventoryQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive?: boolean;
}
