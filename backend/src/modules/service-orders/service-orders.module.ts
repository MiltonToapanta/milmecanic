import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ServiceDiagnosticsModule } from '../service-diagnostics/service-diagnostics.module';
import { ServiceOrdersController } from './controllers/service-orders.controller';
import { ServiceOrdersRepository } from './repositories/service-orders.repository';
import { ServiceOrderPdfService } from './services/service-order-pdf.service';
import { ServiceOrdersService } from './services/service-orders.service';

@Module({
  imports: [AuditModule, ServiceDiagnosticsModule],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService, ServiceOrdersRepository, ServiceOrderPdfService],
  exports: [ServiceOrdersService]
})
export class ServiceOrdersModule {}
