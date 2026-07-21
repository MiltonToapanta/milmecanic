import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelType, TransmissionType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min
} from 'class-validator';

const nextYear = new Date().getFullYear() + 1;

export class CreateVehicleDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().replace(/\s+/gu, '').toUpperCase() : value))
  @IsString()
  @Length(5, 10)
  plate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @Length(10, 30)
  vin?: string;

  @ApiProperty()
  @IsString()
  @Length(1, 80)
  brand: string;

  @ApiProperty()
  @IsString()
  @Length(1, 80)
  model: string;

  @ApiProperty()
  @IsInt()
  @Min(1900)
  @Max(nextYear)
  year: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  engineNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  chassisNumber?: string;

  @ApiProperty({ enum: FuelType })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiProperty({ enum: TransmissionType })
  @IsEnum(TransmissionType)
  transmissionType: TransmissionType;

  @ApiProperty()
  @IsInt()
  @Min(0)
  mileage: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
