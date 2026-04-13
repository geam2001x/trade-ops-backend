import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { InventoryLotStatus } from '../inventory/enums/inventory-lot-status.enum';
import { InventoryLot } from '../inventory/entities/inventory-lot.entity';
import {
  ORDER_CHECKPOINT_FLOW,
  OrderCheckpointStatus,
} from '../procurement/enums/order-checkpoint-status.enum';
import { PurchaseOrder } from '../procurement/entities/purchase-order.entity';
import { PurchaseOrderCheckpointEvent } from '../procurement/entities/purchase-order-checkpoint-event.entity';
import { CustomerReference } from './entities/customer-reference.entity';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderStatusDto } from './dto/update-sales-order-status.dto';
import { SalesOrderItemLot } from './entities/sales-order-item-lot.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderStatus } from './enums/sales-order-status.enum';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrdersRepository: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private readonly salesOrderItemsRepository: Repository<SalesOrderItem>,
    @InjectRepository(SalesOrderItemLot)
    private readonly salesOrderItemLotsRepository: Repository<SalesOrderItemLot>,
    @InjectRepository(InventoryLot)
    private readonly inventoryLotsRepository: Repository<InventoryLot>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderCheckpointEvent)
    private readonly checkpointEventsRepository: Repository<PurchaseOrderCheckpointEvent>,
    @InjectRepository(CustomerReference)
    private readonly customersRepository: Repository<CustomerReference>,
    private readonly dataSource: DataSource,
  ) {}

  async createSalesOrder(createSalesOrderDto: CreateSalesOrderDto): Promise<SalesOrder> {
    if (createSalesOrderDto.customerId) {
      const customer = await this.customersRepository.findOne({
        where: {
          id: createSalesOrderDto.customerId,
        },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    for (const item of createSalesOrderDto.items) {
      const lotQuantity = item.lots.reduce(
        (sum, lot) => sum + lot.quantityConsumed,
        0,
      );

      if (Number(lotQuantity.toFixed(4)) !== Number(item.quantity.toFixed(4))) {
        throw new BadRequestException(
          'The total quantity consumed from lots must match the sales item quantity',
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const salesOrdersRepository = manager.getRepository(SalesOrder);
      const salesOrderItemsRepository = manager.getRepository(SalesOrderItem);
      const salesOrderItemLotsRepository = manager.getRepository(SalesOrderItemLot);
      const inventoryLotsRepository = manager.getRepository(InventoryLot);

      const salesOrder = salesOrdersRepository.create({
        customerId: createSalesOrderDto.customerId ?? null,
        saleType: createSalesOrderDto.saleType,
        orderNumber: createSalesOrderDto.orderNumber,
        orderDate: createSalesOrderDto.orderDate,
        currencyCode: createSalesOrderDto.currencyCode,
        exchangeRateToUsd: createSalesOrderDto.exchangeRateToUsd.toFixed(6),
        totalOriginal: createSalesOrderDto.totalOriginal.toFixed(4),
        totalUsd: createSalesOrderDto.totalUsd.toFixed(4),
        status: createSalesOrderDto.status,
        customerNameSnapshot: createSalesOrderDto.customerNameSnapshot ?? null,
        customerTaxIdSnapshot: createSalesOrderDto.customerTaxIdSnapshot ?? null,
        notes: createSalesOrderDto.notes ?? null,
        createdByUserId: createSalesOrderDto.createdByUserId,
      });

      const savedSalesOrder = await salesOrdersRepository.save(salesOrder);

      for (const item of createSalesOrderDto.items) {
        const savedItem = await salesOrderItemsRepository.save(
          salesOrderItemsRepository.create({
            salesOrderId: Number(savedSalesOrder.id),
            productId: item.productId,
            productDescriptionSnapshot: item.productDescriptionSnapshot,
            quantity: item.quantity.toFixed(4),
            unitPriceOriginal: item.unitPriceOriginal.toFixed(4),
            unitPriceUsd: item.unitPriceUsd.toFixed(4),
            lineTotalOriginal: item.lineTotalOriginal.toFixed(4),
            lineTotalUsd: item.lineTotalUsd.toFixed(4),
          }),
        );

        for (const lotInput of item.lots) {
          const inventoryLot = await inventoryLotsRepository.findOne({
            where: {
              id: lotInput.inventoryLotId,
            },
          });

          if (!inventoryLot) {
            throw new NotFoundException(
              `Inventory lot ${lotInput.inventoryLotId} not found`,
            );
          }

          const available = Number(inventoryLot.availableQuantity);
          const reserved = Number(inventoryLot.reservedQuantity);
          const quantityConsumed = lotInput.quantityConsumed;

          if (reserved >= quantityConsumed) {
            inventoryLot.reservedQuantity = (reserved - quantityConsumed).toFixed(4);
          } else if (available >= quantityConsumed) {
            inventoryLot.availableQuantity = (available - quantityConsumed).toFixed(4);
          } else {
            throw new BadRequestException(
              `Inventory lot ${inventoryLot.id} does not have enough quantity`,
            );
          }

          const nextAvailable = Number(inventoryLot.availableQuantity);
          const nextReserved = Number(inventoryLot.reservedQuantity);
          inventoryLot.status =
            nextAvailable <= 0 && nextReserved <= 0
              ? InventoryLotStatus.DEPLETED
              : nextReserved > 0
                ? InventoryLotStatus.RESERVED
                : InventoryLotStatus.AVAILABLE;

          await inventoryLotsRepository.save(inventoryLot);

          await salesOrderItemLotsRepository.save(
            salesOrderItemLotsRepository.create({
              salesOrderItemId: Number(savedItem.id),
              inventoryLotId: Number(inventoryLot.id),
              quantityConsumed: quantityConsumed.toFixed(4),
              unitLandedCostUsdSnapshot: Number(
                inventoryLot.unitLandedCostUsd,
              ).toFixed(4),
            }),
          );
        }
      }

      return salesOrdersRepository.findOneOrFail({
        where: {
          id: savedSalesOrder.id,
        },
        relations: {
          items: {
            lots: true,
          },
        },
      });
    });
  }

  async findAllSalesOrders(): Promise<SalesOrder[]> {
    return this.salesOrdersRepository.find({
      relations: {
        items: {
          lots: true,
        },
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findSalesOrderById(id: number): Promise<SalesOrder> {
    const salesOrder = await this.salesOrdersRepository.findOne({
      where: {
        id,
      },
      relations: {
        items: {
          lots: true,
        },
      },
    });

    if (!salesOrder) {
      throw new NotFoundException('Sales order not found');
    }

    return salesOrder;
  }

  async updateSalesOrderStatus(
    id: number,
    updateSalesOrderStatusDto: UpdateSalesOrderStatusDto,
  ): Promise<SalesOrder> {
    await this.findSalesOrderById(id);

    await this.salesOrdersRepository.update(
      { id },
      {
        status: updateSalesOrderStatusDto.status,
        notes: updateSalesOrderStatusDto.notes ?? null,
      },
    );

    if (
      updateSalesOrderStatusDto.status === SalesOrderStatus.DISPATCHED ||
      updateSalesOrderStatusDto.status === SalesOrderStatus.COMPLETED
    ) {
      await this.advancePurchaseOrderCheckpointFromSales(
        id,
        updateSalesOrderStatusDto.status,
        updateSalesOrderStatusDto.changedByUserId,
        updateSalesOrderStatusDto.notes,
      );
    }

    return this.findSalesOrderById(id);
  }

  private async advancePurchaseOrderCheckpointFromSales(
    salesOrderId: number,
    status: SalesOrderStatus,
    changedByUserId?: number,
    notes?: string,
  ): Promise<void> {
    const targetCheckpoint =
      status === SalesOrderStatus.DISPATCHED
        ? OrderCheckpointStatus.OUT_FOR_DELIVERY
        : OrderCheckpointStatus.SOLD_OR_PAID;

    const purchaseOrders = await this.dataSource.query(
      `
        SELECT DISTINCT
          po.id AS id,
          po.current_checkpoint_status AS currentCheckpointStatus
        FROM sales_orders so
        INNER JOIN sales_order_items soi ON soi.sales_order_id = so.id
        INNER JOIN sales_order_item_lots sol ON sol.sales_order_item_id = soi.id
        INNER JOIN inventory_lots il ON il.id = sol.inventory_lot_id
        INNER JOIN purchase_order_items poi ON poi.id = il.purchase_order_item_id
        INNER JOIN purchase_orders po ON po.id = poi.purchase_order_id
        WHERE so.id = ?
      `,
      [salesOrderId],
    );

    const targetIndex = ORDER_CHECKPOINT_FLOW.indexOf(targetCheckpoint);
    const now = new Date();

    for (const row of purchaseOrders as Array<{
      id: number;
      currentCheckpointStatus: string;
    }>) {
      const currentIndex = ORDER_CHECKPOINT_FLOW.indexOf(
        row.currentCheckpointStatus as OrderCheckpointStatus,
      );

      if (currentIndex === -1 || currentIndex >= targetIndex) {
        continue;
      }

      await this.purchaseOrdersRepository.update(
        { id: Number(row.id) },
        {
          currentCheckpointStatus: targetCheckpoint,
          currentCheckpointUpdatedAt: now,
        },
      );

      if (changedByUserId) {
        await this.checkpointEventsRepository.save(
          this.checkpointEventsRepository.create({
            purchaseOrderId: Number(row.id),
            fromCheckpoint: row.currentCheckpointStatus,
            toCheckpoint: targetCheckpoint,
            changedByUserId,
            changedAt: now,
            notes: notes ?? null,
          }),
        );
      }
    }
  }
}
