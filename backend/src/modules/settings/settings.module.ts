import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SettingsController } from './controllers/settings.controller';
import { SettingsRepository } from './repositories/settings.repository';
import { SettingsService } from './services/settings.service';

@Module({
  imports: [AuditModule],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository],
  exports: [SettingsService]
})
export class SettingsModule {}
