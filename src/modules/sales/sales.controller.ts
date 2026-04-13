import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderStatusDto } from './dto/update-sales-order-status.dto';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('orders')
  createSalesOrder(
    @Body() createSalesOrderDto: CreateSalesOrderDto,
  ): Promise<SalesOrder> {
    return this.salesService.createSalesOrder(createSalesOrderDto);
  }

  @Get('orders')
  findAllSalesOrders(): Promise<SalesOrder[]> {
    return this.salesService.findAllSalesOrders();
  }

  @Get('orders/:id')
  findSalesOrderById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesOrder> {
    return this.salesService.findSalesOrderById(id);
  }

  @Patch('orders/:id/status')
  updateSalesOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSalesOrderStatusDto: UpdateSalesOrderStatusDto,
  ): Promise<SalesOrder> {
    return this.salesService.updateSalesOrderStatus(
      id,
      updateSalesOrderStatusDto,
    );
  }
}

