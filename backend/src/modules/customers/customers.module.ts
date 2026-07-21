import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CustomersController } from './controllers/customers.controller';
import { CustomersRepository } from './repositories/customers.repository';
import { CustomersService } from './services/customers.service';

@Module({
  imports: [AuditModule],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository],
  exports: [CustomersService]
})
export class CustomersModule {}
