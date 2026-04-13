import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { ReceiveInventoryLotDto } from './dto/receive-inventory-lot.dto';
import { InventoryLot } from './entities/inventory-lot.entity';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('lots/receive')
  receiveInventoryLot(
    @Body() receiveInventoryLotDto: ReceiveInventoryLotDto,
  ): Promise<InventoryLot> {
    return this.inventoryService.receiveInventoryLot(receiveInventoryLotDto);
  }

  @Get('lots')
  findAllInventoryLots(): Promise<InventoryLot[]> {
    return this.inventoryService.findAllInventoryLots();
  }

  @Get('lots/:id')
  findInventoryLotById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InventoryLot> {
    return this.inventoryService.findInventoryLotById(id);
  }

  @Post('lots/:id/movements')
  createInventoryMovement(
    @Param('id', ParseIntPipe) id: number,
    @Body() createInventoryMovementDto: CreateInventoryMovementDto,
  ): Promise<InventoryLot> {
    return this.inventoryService.createInventoryMovement(
      id,
      createInventoryMovementDto,
    );
  }
}

