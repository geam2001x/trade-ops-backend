import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryLot } from '../inventory/entities/inventory-lot.entity';
import { PurchaseOrderCheckpointEvent } from '../procurement/entities/purchase-order-checkpoint-event.entity';
import { PurchaseOrder } from '../procurement/entities/purchase-order.entity';
import { CustomerReference } from './entities/customer-reference.entity';
import { SalesOrderItemLot } from './entities/sales-order-item-lot.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderItem,
      SalesOrderItemLot,
      InventoryLot,
      PurchaseOrder,
      PurchaseOrderCheckpointEvent,
      CustomerReference,
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
