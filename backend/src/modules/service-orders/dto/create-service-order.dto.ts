import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateServiceOrderDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedAdvisorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedMechanicId?: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  reportedMileage: number;

  @ApiProperty({ enum: FuelLevel })
  @IsEnum(FuelLevel)
  fuelLevel: FuelLevel;

  @ApiProperty({ minLength: 5, maxLength: 2000 })
  @IsString()
  @Length(5, 2000)
  customerRequest: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  initialDiagnosis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exteriorCondition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interiorCondition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receivedAccessories?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerSignatureName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workshopSignatureName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  estimatedDeliveryAt?: Date;
}
