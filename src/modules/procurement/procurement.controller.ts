import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { AdvancePurchaseOrderCheckpointDto } from './dto/advance-purchase-order-checkpoint.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { OrderCheckpointStatus } from './enums/order-checkpoint-status.enum';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { ProcurementService } from './procurement.service';

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('orders')
  createOrder(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    return this.procurementService.createOrder(createPurchaseOrderDto);
  }

  @Get('orders')
  findAllOrders(): Promise<PurchaseOrder[]> {
    return this.procurementService.findAllOrders();
  }

  @Get('orders/:id')
  findOrderById(@Param('id', ParseIntPipe) id: number): Promise<PurchaseOrder> {
    return this.procurementService.findOrderById(id);
  }

  @Post('orders/:id/advance-checkpoint')
  advanceOrderCheckpoint(
    @Param('id', ParseIntPipe) id: number,
    @Body() advanceCheckpointDto: AdvancePurchaseOrderCheckpointDto,
  ): Promise<PurchaseOrder> {
    return this.procurementService.advanceOrderCheckpoint(id, advanceCheckpointDto);
  }

  @Get('checkpoints/summary')
  getCheckpointSummary() {
    return this.procurementService.getCheckpointSummary();
  }

  @Get('checkpoints/:checkpoint/articles')
  getCheckpointArticles(@Param('checkpoint') checkpoint: OrderCheckpointStatus) {
    return this.procurementService.getCheckpointArticles(checkpoint);
  }
}
