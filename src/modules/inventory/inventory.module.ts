import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PurchaseOrderItem } from '../procurement/entities/purchase-order-item.entity';
import { ShipmentItem } from '../shipments/entities/shipment-item.entity';
import { InventoryController } from './inventory.controller';
import { InventoryLot } from './entities/inventory-lot.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { WarehouseReference } from './entities/warehouse-reference.entity';
import { InventoryService } from './inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryLot,
      InventoryMovement,
      ShipmentItem,
      PurchaseOrderItem,
      WarehouseReference,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}

