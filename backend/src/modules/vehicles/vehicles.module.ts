import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { VehiclesController } from './controllers/vehicles.controller';
import { VehiclesRepository } from './repositories/vehicles.repository';
import { VehiclesService } from './services/vehicles.service';

@Module({
  imports: [AuditModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehiclesRepository],
  exports: [VehiclesService]
})
export class VehiclesModule {}
