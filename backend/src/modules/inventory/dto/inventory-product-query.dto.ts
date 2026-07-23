import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ToBoolean, ToNumber } from './inventory-query-utils';

export class InventoryProductQueryDto {
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isStockControlled?: boolean;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  lowStock?: boolean;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  outOfStock?: boolean;
}
