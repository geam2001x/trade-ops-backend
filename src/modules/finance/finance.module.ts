import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ImportExpense } from '../customs/entities/import-expense.entity';
import { InventoryLot } from '../inventory/entities/inventory-lot.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { LandedCostAllocation } from './entities/landed-cost-allocation.entity';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LandedCostAllocation,
      ImportExpense,
      InventoryLot,
      SalesOrder,
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
