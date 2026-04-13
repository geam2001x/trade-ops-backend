import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { PurchaseOrderItem } from '../procurement/entities/purchase-order-item.entity';
import { ShipmentItem } from '../shipments/entities/shipment-item.entity';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { ReceiveInventoryLotDto } from './dto/receive-inventory-lot.dto';
import { InventoryLotStatus } from './enums/inventory-lot-status.enum';
import { InventoryMovementType } from './enums/inventory-movement-type.enum';
import { InventoryLot } from './entities/inventory-lot.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { WarehouseReference } from './entities/warehouse-reference.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryLot)
    private readonly inventoryLotsRepository: Repository<InventoryLot>,
    @InjectRepository(InventoryMovement)
    private readonly inventoryMovementsRepository: Repository<InventoryMovement>,
    @InjectRepository(ShipmentItem)
    private readonly shipmentItemsRepository: Repository<ShipmentItem>,
    @InjectRepository(PurchaseOrderItem)
    private readonly purchaseOrderItemsRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(WarehouseReference)
    private readonly warehousesRepository: Repository<WarehouseReference>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllWarehouses(): Promise<WarehouseReference[]> {
    return this.warehousesRepository.find({
      where: {
        isActive: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async receiveInventoryLot(
    receiveInventoryLotDto: ReceiveInventoryLotDto,
  ): Promise<InventoryLot> {
    const shipmentItem = await this.shipmentItemsRepository.findOne({
      where: {
        id: receiveInventoryLotDto.shipmentItemId,
      },
    });

    if (!shipmentItem) {
      throw new NotFoundException('Shipment item not found');
    }

    const purchaseOrderItem = await this.purchaseOrderItemsRepository.findOne({
      where: {
        id: Number(shipmentItem.purchaseOrderItemId),
      },
    });

    if (!purchaseOrderItem) {
      throw new NotFoundException('Purchase order item not found');
    }

    const warehouse = await this.warehousesRepository.findOne({
      where: {
        id: receiveInventoryLotDto.warehouseId,
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    const existingLot = await this.inventoryLotsRepository.findOne({
      where: {
        lotCode: receiveInventoryLotDto.lotCode,
      },
    });

    if (existingLot) {
      throw new BadRequestException('Lot code already exists');
    }

    const purchaseUnitCostUsd = Number(purchaseOrderItem.unitPriceUsd);
    const allocatedImportCostUsd =
      receiveInventoryLotDto.allocatedImportCostUsd ?? 0;
    const unitLandedCostUsd =
      purchaseUnitCostUsd +
      allocatedImportCostUsd / receiveInventoryLotDto.receivedQuantity;
    const receivedAt = receiveInventoryLotDto.receivedAt
      ? new Date(receiveInventoryLotDto.receivedAt)
      : new Date();

    return this.dataSource.transaction(async (manager) => {
      const inventoryLotsRepository = manager.getRepository(InventoryLot);
      const inventoryMovementsRepository = manager.getRepository(InventoryMovement);

      const lot = inventoryLotsRepository.create({
        productId: Number(shipmentItem.productId),
        purchaseOrderItemId: Number(shipmentItem.purchaseOrderItemId),
        shipmentItemId: Number(shipmentItem.id),
        warehouseId: receiveInventoryLotDto.warehouseId,
        lotCode: receiveInventoryLotDto.lotCode,
        receivedQuantity: receiveInventoryLotDto.receivedQuantity.toFixed(4),
        availableQuantity: receiveInventoryLotDto.receivedQuantity.toFixed(4),
        reservedQuantity: '0.0000',
        status: InventoryLotStatus.AVAILABLE,
        receivedAt,
        purchaseUnitCostUsd: purchaseUnitCostUsd.toFixed(4),
        allocatedImportCostUsd: allocatedImportCostUsd.toFixed(4),
        unitLandedCostUsd: unitLandedCostUsd.toFixed(4),
      });

      const savedLot = await inventoryLotsRepository.save(lot);

      const inboundMovement = inventoryMovementsRepository.create({
        inventoryLotId: Number(savedLot.id),
        movementType: InventoryMovementType.INBOUND,
        quantity: receiveInventoryLotDto.receivedQuantity.toFixed(4),
        referenceType: 'shipment_item',
        referenceId: Number(shipmentItem.id),
        movementDate: receivedAt,
        notes:
          receiveInventoryLotDto.notes ??
          `Inbound reception from shipment item ${shipmentItem.id}.`,
      });

      await inventoryMovementsRepository.save(inboundMovement);

      return inventoryLotsRepository.findOneOrFail({
        where: {
          id: savedLot.id,
        },
        relations: {
          movements: true,
        },
      });
    });
  }

  async findAllInventoryLots(): Promise<InventoryLot[]> {
    return this.inventoryLotsRepository.find({
      relations: {
        movements: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findInventoryLotById(id: number): Promise<InventoryLot> {
    const lot = await this.inventoryLotsRepository.findOne({
      where: {
        id,
      },
      relations: {
        movements: true,
      },
    });

    if (!lot) {
      throw new NotFoundException('Inventory lot not found');
    }

    return lot;
  }

  async createInventoryMovement(
    inventoryLotId: number,
    createInventoryMovementDto: CreateInventoryMovementDto,
  ): Promise<InventoryLot> {
    const lot = await this.findInventoryLotById(inventoryLotId);
    const available = Number(lot.availableQuantity);
    const reserved = Number(lot.reservedQuantity);
    const quantity = createInventoryMovementDto.quantity;

    let nextAvailable = available;
    let nextReserved = reserved;

    switch (createInventoryMovementDto.movementType) {
      case InventoryMovementType.RESERVE:
        if (available < quantity) {
          throw new BadRequestException('Not enough available quantity to reserve');
        }
        nextAvailable -= quantity;
        nextReserved += quantity;
        break;
      case InventoryMovementType.RELEASE:
        if (reserved < quantity) {
          throw new BadRequestException('Not enough reserved quantity to release');
        }
        nextReserved -= quantity;
        nextAvailable += quantity;
        break;
      case InventoryMovementType.SALE:
        if (reserved >= quantity) {
          nextReserved -= quantity;
        } else if (available >= quantity) {
          nextAvailable -= quantity;
        } else {
          throw new BadRequestException('Not enough quantity to register sale');
        }
        break;
      case InventoryMovementType.LOSS:
        if (available >= quantity) {
          nextAvailable -= quantity;
        } else {
          throw new BadRequestException('Not enough available quantity to register loss');
        }
        break;
      case InventoryMovementType.ADJUSTMENT:
        nextAvailable += quantity;
        break;
      case InventoryMovementType.INBOUND:
        nextAvailable += quantity;
        break;
      default:
        throw new BadRequestException('Unsupported movement type');
    }

    const nextStatus =
      nextAvailable <= 0 && nextReserved <= 0
        ? InventoryLotStatus.DEPLETED
        : nextReserved > 0
          ? InventoryLotStatus.RESERVED
          : InventoryLotStatus.AVAILABLE;

    await this.inventoryLotsRepository.update(
      { id: Number(lot.id) },
      {
        availableQuantity: nextAvailable.toFixed(4),
        reservedQuantity: nextReserved.toFixed(4),
        status: nextStatus,
      },
    );

    const movement = this.inventoryMovementsRepository.create({
      inventoryLotId: Number(lot.id),
      movementType: createInventoryMovementDto.movementType,
      quantity: quantity.toFixed(4),
      referenceType: createInventoryMovementDto.referenceType ?? null,
      referenceId: createInventoryMovementDto.referenceId ?? null,
      movementDate: createInventoryMovementDto.movementDate
        ? new Date(createInventoryMovementDto.movementDate)
        : new Date(),
      notes: createInventoryMovementDto.notes ?? null,
    });

    await this.inventoryMovementsRepository.save(movement);

    return this.findInventoryLotById(Number(lot.id));
  }
}
