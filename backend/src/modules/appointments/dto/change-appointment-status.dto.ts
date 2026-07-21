import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { IsEnum, IsString, Length, ValidateIf } from 'class-validator';

export class ChangeAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiPropertyOptional()
  @ValidateIf((dto: ChangeAppointmentStatusDto) => dto.status === AppointmentStatus.CANCELLED)
  @IsString()
  @Length(3, 250)
  cancellationReason?: string;
}
