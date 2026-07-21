import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { CustomersModule } from './modules/customers/customers.module';
import { HealthModule } from './modules/health/health.module';
import { RolesModule } from './modules/roles/roles.module';
import { ServiceDiagnosticsModule } from './modules/service-diagnostics/service-diagnostics.module';
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    VehiclesModule,
    AppointmentsModule,
    ServiceOrdersModule,
    ServiceDiagnosticsModule,
    RolesModule,
    SettingsModule,
    AuditModule,
    HealthModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
