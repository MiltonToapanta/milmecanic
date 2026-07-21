import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      api: 'ok',
      database: 'ok',
      serverTime: new Date().toISOString(),
      version: '0.1.0'
    };
  }
}
