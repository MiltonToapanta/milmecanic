import { StockMovementType, StockReferenceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min
} from 'class-validator';

export class CreateStockMovementDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsEnum(StockMovementType)
  movementType!: StockMovementType;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCost?: number;

  @IsEnum(StockReferenceType)
  @IsOptional()
  referenceType?: StockReferenceType;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  referenceId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
