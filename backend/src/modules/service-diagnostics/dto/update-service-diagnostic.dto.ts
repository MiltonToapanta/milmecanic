import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateServiceDiagnosticDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  generalObservation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recommendation?: string;
}
