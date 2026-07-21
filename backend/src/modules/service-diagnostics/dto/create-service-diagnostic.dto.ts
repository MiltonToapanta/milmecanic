import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { DiagnosticItemDto } from "./diagnostic-item.dto";

export class CreateServiceDiagnosticDto {
  @ApiProperty()
  @IsUUID()
  serviceOrderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  generalObservation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recommendation?: string;

  @ApiProperty({ type: [DiagnosticItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DiagnosticItemDto)
  items: DiagnosticItemDto[];
}
