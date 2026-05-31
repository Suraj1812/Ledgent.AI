import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { validateEnv } from "./common/config/env";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { AiModule } from "./modules/ai/ai.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { MetaModule } from "./modules/meta/meta.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { PurchaseOrdersModule } from "./modules/purchase-orders/purchase-orders.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { UsersModule } from "./modules/users/users.module";
import { VendorsModule } from "./modules/vendors/vendors.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    MetaModule,
    HealthModule,
    OrganizationsModule,
    UsersModule,
    VendorsModule,
    PurchaseOrdersModule,
    InvoicesModule,
    ApprovalsModule,
    AiModule,
    IntegrationsModule,
    AuditModule,
    NotificationsModule,
    ReportsModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard }
  ]
})
export class AppModule {}
