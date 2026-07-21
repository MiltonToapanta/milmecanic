import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ServiceOrdersController } from './controllers/service-orders.controller';
import { ServiceOrdersRepository } from './repositories/service-orders.repository';
import { ServiceOrdersService } from './services/service-orders.service';

@Module({
  imports: [AuditModule],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService, ServiceOrdersRepository],
  exports: [ServiceOrdersService]
})
export class ServiceOrdersModule {}
