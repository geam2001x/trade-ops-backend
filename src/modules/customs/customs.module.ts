import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Shipment } from '../shipments/entities/shipment.entity';
import { CustomsController } from './customs.controller';
import { CustomsService } from './customs.service';
import { CustomsEntry } from './entities/customs-entry.entity';
import { ImportExpense } from './entities/import-expense.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomsEntry, ImportExpense, Shipment]),
  ],
  controllers: [CustomsController],
  providers: [CustomsService],
  exports: [CustomsService],
})
export class CustomsModule {}

