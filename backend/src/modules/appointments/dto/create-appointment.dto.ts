import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  scheduledAt: Date;

  @ApiProperty({ minimum: 15, maximum: 480 })
  @IsInt()
  @Min(15)
  @Max(480)
  estimatedDurationMinutes: number;

  @ApiProperty()
  @IsString()
  @Length(3, 250)
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
