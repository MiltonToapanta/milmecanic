import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import { QuotationItemType } from '@prisma/client';

export class UpdateQuotationItemDto {
  @IsEnum(QuotationItemType)
  @IsOptional()
  itemType?: QuotationItemType;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  quantity?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRate?: number;
}

export class UpdateQuotationDto {
  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuotationItemDto)
  items?: UpdateQuotationItemDto[];
}
