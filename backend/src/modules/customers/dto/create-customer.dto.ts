import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType, IdentificationType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ enum: CustomerType })
  @IsEnum(CustomerType)
  customerType: CustomerType;

  @ApiProperty({ enum: IdentificationType })
  @IsEnum(IdentificationType)
  identificationType: IdentificationType;

  @ApiProperty()
  @IsString()
  @Length(5, 20)
  identification: string;

  @ApiPropertyOptional()
  @ValidateIf((dto: CreateCustomerDto) => dto.customerType === CustomerType.PERSON)
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiPropertyOptional()
  @ValidateIf((dto: CreateCustomerDto) => dto.customerType === CustomerType.PERSON)
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiPropertyOptional()
  @ValidateIf((dto: CreateCustomerDto) => dto.customerType === CustomerType.COMPANY)
  @IsString()
  @Length(1, 180)
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(7, 20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(7, 20)
  secondaryPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
