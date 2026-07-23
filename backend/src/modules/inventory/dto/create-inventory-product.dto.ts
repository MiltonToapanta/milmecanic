import { InventoryUnit } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min
} from 'class-validator';

export class CreateInventoryProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  sku!: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  barcode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  categoryId!: string;

  @IsEnum(InventoryUnit)
  unit!: InventoryUnit;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumStock!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maximumStock?: number;

  @IsBoolean()
  @IsOptional()
  isStockControlled?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
