import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AppointmentsController } from './controllers/appointments.controller';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { AppointmentsService } from './services/appointments.service';

@Module({
  imports: [AuditModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService]
})
export class AppointmentsModule {}
