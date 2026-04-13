import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { PurchaseOrderItem } from '../procurement/entities/purchase-order-item.entity';
import { PurchaseOrder } from '../procurement/entities/purchase-order.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateShipmentEventDto } from './dto/create-shipment-event.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { ShipmentStatus } from './enums/shipment-status.enum';
import { ShipmentEvent } from './entities/shipment-event.entity';
import { ShipmentItem } from './entities/shipment-item.entity';
import { Shipment } from './entities/shipment.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentsRepository: Repository<Shipment>,
    @InjectRepository(ShipmentItem)
    private readonly shipmentItemsRepository: Repository<ShipmentItem>,
    @InjectRepository(ShipmentEvent)
    private readonly shipmentEventsRepository: Repository<ShipmentEvent>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly purchaseOrderItemsRepository: Repository<PurchaseOrderItem>,
    private readonly dataSource: DataSource,
  ) {}

  async createShipment(createShipmentDto: CreateShipmentDto): Promise<Shipment> {
    const purchaseOrder = await this.purchaseOrdersRepository.findOne({
      where: {
        id: createShipmentDto.purchaseOrderId,
      },
      relations: {
        items: true,
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    const allowedPurchaseOrderItemIds = new Set(
      purchaseOrder.items.map((item) => Number(item.id)),
    );

    for (const item of createShipmentDto.items) {
      if (!allowedPurchaseOrderItemIds.has(item.purchaseOrderItemId)) {
        throw new BadRequestException(
          `Purchase order item ${item.purchaseOrderItemId} does not belong to purchase order ${purchaseOrder.id}`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const shipmentsRepository = manager.getRepository(Shipment);
      const shipmentItemsRepository = manager.getRepository(ShipmentItem);
      const shipmentEventsRepository = manager.getRepository(ShipmentEvent);

      const shipment = shipmentsRepository.create({
        purchaseOrderId: createShipmentDto.purchaseOrderId,
        shipmentNumber: createShipmentDto.shipmentNumber,
        transportMode: createShipmentDto.transportMode,
        carrierName: createShipmentDto.carrierName ?? null,
        originLocation: createShipmentDto.originLocation ?? null,
        destinationLocation: createShipmentDto.destinationLocation ?? null,
        trackingReference: createShipmentDto.trackingReference ?? null,
        etd: createShipmentDto.etd ?? null,
        eta: createShipmentDto.eta ?? null,
        actualDepartureAt: createShipmentDto.actualDepartureAt
          ? new Date(createShipmentDto.actualDepartureAt)
          : null,
        actualArrivalAt: createShipmentDto.actualArrivalAt
          ? new Date(createShipmentDto.actualArrivalAt)
          : null,
        status: createShipmentDto.status ?? ShipmentStatus.PLANNED,
      });

      const savedShipment = await shipmentsRepository.save(shipment);

      const shipmentItems = createShipmentDto.items.map((item) =>
        shipmentItemsRepository.create({
          shipmentId: Number(savedShipment.id),
          purchaseOrderItemId: item.purchaseOrderItemId,
          productId: item.productId,
          quantityShipped: item.quantityShipped.toFixed(4),
        }),
      );

      await shipmentItemsRepository.save(shipmentItems);

      const initialEvent = shipmentEventsRepository.create({
        shipmentId: Number(savedShipment.id),
        eventType: 'shipment_created',
        eventDate: new Date(),
        location: createShipmentDto.originLocation ?? null,
        description: `Shipment created with status ${shipment.status}.`,
      });

      await shipmentEventsRepository.save(initialEvent);

      return shipmentsRepository.findOneOrFail({
        where: {
          id: savedShipment.id,
        },
        relations: {
          items: true,
          events: true,
        },
      });
    });
  }

  async findAllShipments(): Promise<Shipment[]> {
    return this.shipmentsRepository.find({
      relations: {
        items: true,
        events: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findShipmentById(id: number): Promise<Shipment> {
    const shipment = await this.shipmentsRepository.findOne({
      where: {
        id,
      },
      relations: {
        items: true,
        events: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return shipment;
  }

  async createShipmentEvent(
    id: number,
    createShipmentEventDto: CreateShipmentEventDto,
  ): Promise<Shipment> {
    const shipment = await this.findShipmentById(id);

    const event = this.shipmentEventsRepository.create({
      shipmentId: Number(shipment.id),
      eventType: createShipmentEventDto.eventType,
      eventDate: new Date(createShipmentEventDto.eventDate),
      location: createShipmentEventDto.location ?? null,
      description: createShipmentEventDto.description ?? null,
    });

    await this.shipmentEventsRepository.save(event);

    if (createShipmentEventDto.shipmentStatus) {
      await this.shipmentsRepository.update(
        { id: Number(shipment.id) },
        { status: createShipmentEventDto.shipmentStatus },
      );
    }

    return this.findShipmentById(Number(shipment.id));
  }

  async updateShipmentStatus(
    id: number,
    updateShipmentStatusDto: UpdateShipmentStatusDto,
  ): Promise<Shipment> {
    const shipment = await this.findShipmentById(id);
    await this.shipmentsRepository.update(
      { id: Number(shipment.id) },
      { status: updateShipmentStatusDto.status },
    );

    const event = this.shipmentEventsRepository.create({
      shipmentId: Number(shipment.id),
      eventType: 'status_updated',
      eventDate: new Date(),
      location: null,
      description:
        updateShipmentStatusDto.description ??
        `Shipment status updated to ${updateShipmentStatusDto.status}.`,
    });

    await this.shipmentEventsRepository.save(event);

    return this.findShipmentById(Number(shipment.id));
  }
}
