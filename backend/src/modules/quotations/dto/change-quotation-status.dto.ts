import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { QuotationStatus } from '@prisma/client';

export class ChangeQuotationStatusDto {
  @IsEnum(QuotationStatus)
  status!: QuotationStatus;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  rejectionReason?: string;
}
