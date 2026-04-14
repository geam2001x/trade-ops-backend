import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { CustomsModule } from './modules/customs/customs.module';
import { DocumentProcessingModule } from './modules/document-processing/document-processing.module';
import { FinanceModule } from './modules/finance/finance.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { RolesModule } from './modules/roles/roles.module';
import { SalesModule } from './modules/sales/sales.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, authConfig, databaseConfig],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthModule,
    RolesModule,
    UsersModule,
    AuthModule,
    ProcurementModule,
    ShipmentsModule,
    CustomsModule,
    InventoryModule,
    MasterDataModule,
    SalesModule,
    FinanceModule,
    DocumentProcessingModule,
  ],
})
export class AppModule {}
