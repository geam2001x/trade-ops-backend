import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PurchaseOrderItem } from '../procurement/entities/purchase-order-item.entity';
import { PurchaseOrder } from '../procurement/entities/purchase-order.entity';
import { ShipmentEvent } from './entities/shipment-event.entity';
import { ShipmentItem } from './entities/shipment-item.entity';
import { Shipment } from './entities/shipment.entity';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shipment,
      ShipmentItem,
      ShipmentEvent,
      PurchaseOrder,
      PurchaseOrderItem,
    ]),
  ],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}

