import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { QuotationsController } from './controllers/quotations.controller';
import { QuotationsRepository } from './repositories/quotations.repository';
import { QuotationsService } from './services/quotations.service';

@Module({
  imports: [AuditModule],
  controllers: [QuotationsController],
  providers: [QuotationsService, QuotationsRepository],
  exports: [QuotationsService]
})
export class QuotationsModule {}
