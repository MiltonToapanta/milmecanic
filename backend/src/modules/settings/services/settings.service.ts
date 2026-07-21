import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/services/audit.service';
import { UpdateWorkshopSettingDto } from '../dto/update-workshop-setting.dto';
import { SettingsRepository } from '../repositories/settings.repository';

@Injectable()
export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly auditService: AuditService
  ) {}

  async getCurrent() {
    const setting = await this.settingsRepository.findCurrent();
    if (setting) return setting;
    return this.settingsRepository.create({
      tradeName: 'MilMecanic Taller',
      currency: 'USD',
      timezone: 'America/Guayaquil',
      serviceOrderPrefix: 'OT',
      quotationPrefix: 'COT',
      internalInvoicePrefix: 'FAC'
    });
  }

  async update(dto: UpdateWorkshopSettingDto, actorId?: string) {
    const oldSetting = await this.getCurrent();
    const setting = await this.settingsRepository.update(oldSetting.id, { ...dto, updatedById: actorId });
    await this.auditService.log({
      userId: actorId,
      action: 'update',
      module: 'settings',
      entity: 'WorkshopSetting',
      entityId: setting.id,
      oldValues: oldSetting,
      newValues: setting
    });
    return setting;
  }
}
