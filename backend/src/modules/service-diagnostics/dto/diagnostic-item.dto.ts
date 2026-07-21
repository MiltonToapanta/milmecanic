import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  DiagnosticCategory,
  DiagnosticItemStatus,
  DiagnosticSeverity,
} from "@prisma/client";
import { IsEnum, IsOptional, IsString, Length } from "class-validator";

export class DiagnosticItemDto {
  @ApiProperty({ enum: DiagnosticCategory })
  @IsEnum(DiagnosticCategory)
  category: DiagnosticCategory;

  @ApiProperty()
  @IsString()
  @Length(1, 120)
  itemName: string;

  @ApiProperty({ enum: DiagnosticItemStatus })
  @IsEnum(DiagnosticItemStatus)
  status: DiagnosticItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiPropertyOptional({ enum: DiagnosticSeverity })
  @IsOptional()
  @IsEnum(DiagnosticSeverity)
  severity?: DiagnosticSeverity;
}

export class UpdateDiagnosticItemDto {
  @ApiPropertyOptional({ enum: DiagnosticCategory })
  @IsOptional()
  @IsEnum(DiagnosticCategory)
  category?: DiagnosticCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 120)
  itemName?: string;

  @ApiPropertyOptional({ enum: DiagnosticItemStatus })
  @IsOptional()
  @IsEnum(DiagnosticItemStatus)
  status?: DiagnosticItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiPropertyOptional({ enum: DiagnosticSeverity })
  @IsOptional()
  @IsEnum(DiagnosticSeverity)
  severity?: DiagnosticSeverity;
}
