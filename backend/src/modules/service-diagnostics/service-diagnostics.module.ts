import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ServiceDiagnosticsController } from "./controllers/service-diagnostics.controller";
import { ServiceDiagnosticsRepository } from "./repositories/service-diagnostics.repository";
import { ServiceDiagnosticsService } from "./services/service-diagnostics.service";

@Module({
  imports: [AuditModule],
  controllers: [ServiceDiagnosticsController],
  providers: [ServiceDiagnosticsService, ServiceDiagnosticsRepository],
  exports: [ServiceDiagnosticsService],
})
export class ServiceDiagnosticsModule {}
