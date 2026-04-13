import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateShipmentEventDto } from './dto/create-shipment-event.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { Shipment } from './entities/shipment.entity';
import { ShipmentsService } from './shipments.service';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  createShipment(@Body() createShipmentDto: CreateShipmentDto): Promise<Shipment> {
    return this.shipmentsService.createShipment(createShipmentDto);
  }

  @Get()
  findAllShipments(): Promise<Shipment[]> {
    return this.shipmentsService.findAllShipments();
  }

  @Get(':id')
  findShipmentById(@Param('id', ParseIntPipe) id: number): Promise<Shipment> {
    return this.shipmentsService.findShipmentById(id);
  }

  @Post(':id/events')
  createShipmentEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() createShipmentEventDto: CreateShipmentEventDto,
  ): Promise<Shipment> {
    return this.shipmentsService.createShipmentEvent(id, createShipmentEventDto);
  }

  @Patch(':id/status')
  updateShipmentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShipmentStatusDto: UpdateShipmentStatusDto,
  ): Promise<Shipment> {
    return this.shipmentsService.updateShipmentStatus(id, updateShipmentStatusDto);
  }
}

