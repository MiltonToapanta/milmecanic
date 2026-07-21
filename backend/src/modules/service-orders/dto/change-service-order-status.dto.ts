import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceOrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ChangeServiceOrderStatusDto {
  @ApiProperty({ enum: ServiceOrderStatus })
  @IsEnum(ServiceOrderStatus)
  status: ServiceOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  cancellationReason?: string;
}
