import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditRepository } from '../repositories/audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    await this.auditRepository.create({
      action: dto.action,
      module: dto.module,
      entity: dto.entity,
      entityId: dto.entityId,
      oldValues: toJson(dto.oldValues),
      newValues: toJson(dto.newValues),
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      user: dto.userId ? { connect: { id: dto.userId } } : undefined
    });
  }

  findAll() {
    return this.auditRepository.findAll();
  }
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
