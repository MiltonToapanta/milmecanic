export class CreateAuditLogDto {
  userId?: string;
  action: string;
  module: string;
  entity?: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}
