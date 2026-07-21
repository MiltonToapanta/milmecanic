import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCurrent() {
    return this.prisma.workshopSetting.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: 'asc' } });
  }

  create(data: Prisma.WorkshopSettingCreateInput) {
    return this.prisma.workshopSetting.create({ data });
  }

  update(id: string, data: Prisma.WorkshopSettingUpdateInput) {
    return this.prisma.workshopSetting.update({ where: { id }, data });
  }
}
