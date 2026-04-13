import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AdvancePurchaseOrderCheckpointDto } from './dto/advance-purchase-order-checkpoint.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import {
  ORDER_CHECKPOINT_FLOW,
  OrderCheckpointStatus,
} from './enums/order-checkpoint-status.enum';
import { PurchaseOrderCheckpointEvent } from './entities/purchase-order-checkpoint-event.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';

type CheckpointSummaryRow = {
  checkpoint: OrderCheckpointStatus;
  ordersCount: number;
  articlesQuantity: number;
  usdTotal: number;
};

@Injectable()
export class ProcurementService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly purchaseOrderItemsRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(PurchaseOrderCheckpointEvent)
    private readonly checkpointEventsRepository: Repository<PurchaseOrderCheckpointEvent>,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(createPurchaseOrderDto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    return this.dataSource.transaction(async (manager) => {
      const ordersRepository = manager.getRepository(PurchaseOrder);
      const itemsRepository = manager.getRepository(PurchaseOrderItem);
      const eventsRepository = manager.getRepository(PurchaseOrderCheckpointEvent);

      const now = new Date();
      const order = ordersRepository.create({
        supplierId: createPurchaseOrderDto.supplierId,
        purchaseQuotationId: createPurchaseOrderDto.purchaseQuotationId ?? null,
        proformaDocumentUploadId:
          createPurchaseOrderDto.proformaDocumentUploadId ?? null,
        invoiceDocumentUploadId:
          createPurchaseOrderDto.invoiceDocumentUploadId ?? null,
        orderNumber: createPurchaseOrderDto.orderNumber,
        orderDate: createPurchaseOrderDto.orderDate,
        supplierInvoiceNumber:
          createPurchaseOrderDto.supplierInvoiceNumber ?? null,
        supplierInvoiceDate: createPurchaseOrderDto.supplierInvoiceDate ?? null,
        currencyCode: createPurchaseOrderDto.currencyCode,
        paymentTerms: createPurchaseOrderDto.paymentTerms ?? null,
        estimatedDispatchDate:
          createPurchaseOrderDto.estimatedDispatchDate ?? null,
        notes: createPurchaseOrderDto.notes ?? null,
        status: createPurchaseOrderDto.status ?? 'draft',
        currentCheckpointStatus: OrderCheckpointStatus.QUOTATION,
        currentCheckpointUpdatedAt: now,
        createdByUserId: createPurchaseOrderDto.createdByUserId,
      });

      const savedOrder = await ordersRepository.save(order);

      const items = createPurchaseOrderDto.items.map((item) =>
        itemsRepository.create({
          purchaseOrderId: savedOrder.id,
          productId: item.productId,
          productDescriptionSnapshot: item.productDescriptionSnapshot,
          quantityOrdered: item.quantityOrdered.toFixed(4),
          quantityReceived: '0.0000',
          unitMeasure: item.unitMeasure,
          unitPriceOriginal: item.unitPriceOriginal.toFixed(4),
          exchangeRateToUsd: item.exchangeRateToUsd.toFixed(6),
          unitPriceUsd: item.unitPriceUsd.toFixed(4),
          lineTotalOriginal: item.lineTotalOriginal.toFixed(4),
          lineTotalUsd: item.lineTotalUsd.toFixed(4),
        }),
      );

      await itemsRepository.save(items);

      const initialEvent = eventsRepository.create({
        purchaseOrderId: savedOrder.id,
        fromCheckpoint: null,
        toCheckpoint: OrderCheckpointStatus.QUOTATION,
        changedByUserId: createPurchaseOrderDto.createdByUserId,
        changedAt: now,
        notes: 'Initial checkpoint created with purchase order.',
      });

      await eventsRepository.save(initialEvent);

      return ordersRepository.findOneOrFail({
        where: {
          id: savedOrder.id,
        },
        relations: {
          items: true,
          checkpointEvents: true,
        },
      });
    });
  }

  async findAllOrders(): Promise<PurchaseOrder[]> {
    return this.purchaseOrdersRepository.find({
      relations: {
        items: true,
        checkpointEvents: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findOrderById(id: number): Promise<PurchaseOrder> {
    const order = await this.purchaseOrdersRepository.findOne({
      where: {
        id,
      },
      relations: {
        items: true,
        checkpointEvents: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }

    return order;
  }

  async advanceOrderCheckpoint(
    id: number,
    advanceCheckpointDto: AdvancePurchaseOrderCheckpointDto,
  ): Promise<PurchaseOrder> {
    const order = await this.findOrderById(id);
    const currentCheckpoint = order.currentCheckpointStatus;
    const currentIndex = ORDER_CHECKPOINT_FLOW.indexOf(currentCheckpoint);
    const nextCheckpoint = ORDER_CHECKPOINT_FLOW[currentIndex + 1];

    if (!nextCheckpoint) {
      throw new BadRequestException('Purchase order is already at the final checkpoint');
    }

    order.currentCheckpointStatus = nextCheckpoint;
    order.currentCheckpointUpdatedAt = new Date();
    await this.purchaseOrdersRepository.save(order);

    const event = this.checkpointEventsRepository.create({
      purchaseOrderId: order.id,
      fromCheckpoint: currentCheckpoint,
      toCheckpoint: nextCheckpoint,
      changedByUserId: advanceCheckpointDto.changedByUserId,
      changedAt: new Date(),
      notes: advanceCheckpointDto.notes ?? null,
    });

    await this.checkpointEventsRepository.save(event);

    return this.findOrderById(order.id);
  }

  async getCheckpointSummary(): Promise<CheckpointSummaryRow[]> {
    const stageOneToFive = [
      OrderCheckpointStatus.QUOTATION,
      OrderCheckpointStatus.PURCHASED,
      OrderCheckpointStatus.INTERNATIONAL_TRANSPORT,
      OrderCheckpointStatus.CUSTOMS_CHILE,
      OrderCheckpointStatus.LOCAL_TRANSPORT_TO_WAREHOUSE,
    ];

    const orderSummary = await this.purchaseOrderItemsRepository
      .createQueryBuilder('item')
      .innerJoin(PurchaseOrder, 'purchase_order', 'purchase_order.id = item.purchase_order_id')
      .select('purchase_order.current_checkpoint_status', 'checkpoint')
      .addSelect('COUNT(DISTINCT purchase_order.id)', 'ordersCount')
      .addSelect('COALESCE(SUM(item.quantity_ordered), 0)', 'articlesQuantity')
      .addSelect('COALESCE(SUM(item.line_total_usd), 0)', 'usdTotal')
      .where('purchase_order.current_checkpoint_status IN (:...checkpoints)', {
        checkpoints: stageOneToFive,
      })
      .groupBy('purchase_order.current_checkpoint_status')
      .getRawMany<{
        checkpoint: OrderCheckpointStatus;
        ordersCount: string;
        articlesQuantity: string;
        usdTotal: string;
      }>();

    const inventorySummary = await this.dataSource.query(
      `
        SELECT
          'in_warehouse' AS checkpoint,
          COUNT(DISTINCT po.id) AS ordersCount,
          COALESCE(SUM(il.available_quantity + il.reserved_quantity), 0) AS articlesQuantity,
          COALESCE(SUM((il.available_quantity + il.reserved_quantity) * il.unit_landed_cost_usd), 0) AS usdTotal
        FROM inventory_lots il
        INNER JOIN purchase_order_items poi ON poi.id = il.purchase_order_item_id
        INNER JOIN purchase_orders po ON po.id = poi.purchase_order_id
      `,
    );

    const outForDeliverySummary = await this.dataSource.query(
      `
        SELECT
          'out_for_delivery' AS checkpoint,
          COUNT(DISTINCT po.id) AS ordersCount,
          COALESCE(SUM(sol.quantity_consumed), 0) AS articlesQuantity,
          COALESCE(SUM(sol.quantity_consumed * soi.unit_price_usd), 0) AS usdTotal
        FROM sales_order_item_lots sol
        INNER JOIN sales_order_items soi ON soi.id = sol.sales_order_item_id
        INNER JOIN sales_orders so ON so.id = soi.sales_order_id
        INNER JOIN inventory_lots il ON il.id = sol.inventory_lot_id
        INNER JOIN purchase_order_items poi ON poi.id = il.purchase_order_item_id
        INNER JOIN purchase_orders po ON po.id = poi.purchase_order_id
        WHERE so.status = 'dispatched'
      `,
    );

    const soldOrPaidSummary = await this.dataSource.query(
      `
        SELECT
          'sold_or_paid' AS checkpoint,
          COUNT(DISTINCT po.id) AS ordersCount,
          COALESCE(SUM(sol.quantity_consumed), 0) AS articlesQuantity,
          COALESCE(SUM(sol.quantity_consumed * soi.unit_price_usd), 0) AS usdTotal
        FROM sales_order_item_lots sol
        INNER JOIN sales_order_items soi ON soi.id = sol.sales_order_item_id
        INNER JOIN sales_orders so ON so.id = soi.sales_order_id
        INNER JOIN inventory_lots il ON il.id = sol.inventory_lot_id
        INNER JOIN purchase_order_items poi ON poi.id = il.purchase_order_item_id
        INNER JOIN purchase_orders po ON po.id = poi.purchase_order_id
        WHERE so.status = 'completed'
      `,
    );

    const rows = [
      ...orderSummary.map((row) => ({
        checkpoint: row.checkpoint,
        ordersCount: Number(row.ordersCount),
        articlesQuantity: Number(row.articlesQuantity),
        usdTotal: Number(row.usdTotal),
      })),
      ...inventorySummary.map(
        (row: {
          checkpoint: OrderCheckpointStatus;
          ordersCount: number;
          articlesQuantity: number;
          usdTotal: number;
        }) => ({
        checkpoint: row.checkpoint,
        ordersCount: Number(row.ordersCount),
        articlesQuantity: Number(row.articlesQuantity),
        usdTotal: Number(row.usdTotal),
      })),
      ...outForDeliverySummary.map(
        (row: {
          checkpoint: OrderCheckpointStatus;
          ordersCount: number;
          articlesQuantity: number;
          usdTotal: number;
        }) => ({
        checkpoint: row.checkpoint,
        ordersCount: Number(row.ordersCount),
        articlesQuantity: Number(row.articlesQuantity),
        usdTotal: Number(row.usdTotal),
      })),
      ...soldOrPaidSummary.map(
        (row: {
          checkpoint: OrderCheckpointStatus;
          ordersCount: number;
          articlesQuantity: number;
          usdTotal: number;
        }) => ({
        checkpoint: row.checkpoint,
        ordersCount: Number(row.ordersCount),
        articlesQuantity: Number(row.articlesQuantity),
        usdTotal: Number(row.usdTotal),
      })),
    ];

    return ORDER_CHECKPOINT_FLOW.map((checkpoint) => {
      const row = rows.find((summaryRow) => summaryRow.checkpoint === checkpoint);
      return {
        checkpoint,
        ordersCount: row?.ordersCount ?? 0,
        articlesQuantity: row?.articlesQuantity ?? 0,
        usdTotal: row?.usdTotal ?? 0,
      };
    });
  }

  async getCheckpointArticles(checkpoint: OrderCheckpointStatus): Promise<unknown[]> {
    if (
      checkpoint === OrderCheckpointStatus.IN_WAREHOUSE ||
      checkpoint === OrderCheckpointStatus.OUT_FOR_DELIVERY ||
      checkpoint === OrderCheckpointStatus.SOLD_OR_PAID
    ) {
      return this.getPostWarehouseArticles(checkpoint);
    }

    return this.purchaseOrderItemsRepository
      .createQueryBuilder('item')
      .innerJoin(PurchaseOrder, 'purchase_order', 'purchase_order.id = item.purchase_order_id')
      .select('item.product_id', 'productId')
      .addSelect('item.product_description_snapshot', 'productDescription')
      .addSelect('COALESCE(SUM(item.quantity_ordered), 0)', 'quantity')
      .where('purchase_order.current_checkpoint_status = :checkpoint', { checkpoint })
      .groupBy('item.product_id')
      .addGroupBy('item.product_description_snapshot')
      .orderBy('item.product_description_snapshot', 'ASC')
      .getRawMany();
  }

  private async getPostWarehouseArticles(
    checkpoint: OrderCheckpointStatus,
  ): Promise<unknown[]> {
    if (checkpoint === OrderCheckpointStatus.IN_WAREHOUSE) {
      return this.dataSource.query(
        `
          SELECT
            il.product_id AS productId,
            p.name AS productDescription,
            COALESCE(SUM(il.available_quantity + il.reserved_quantity), 0) AS quantity
          FROM inventory_lots il
          INNER JOIN products p ON p.id = il.product_id
          GROUP BY il.product_id, p.name
          ORDER BY p.name ASC
        `,
      );
    }

    const salesStatus =
      checkpoint === OrderCheckpointStatus.OUT_FOR_DELIVERY
        ? 'dispatched'
        : 'completed';

    return this.dataSource.query(
      `
        SELECT
          soi.product_id AS productId,
          soi.product_description_snapshot AS productDescription,
          COALESCE(SUM(sol.quantity_consumed), 0) AS quantity
        FROM sales_order_item_lots sol
        INNER JOIN sales_order_items soi ON soi.id = sol.sales_order_item_id
        INNER JOIN sales_orders so ON so.id = soi.sales_order_id
        WHERE so.status = ?
        GROUP BY soi.product_id, soi.product_description_snapshot
        ORDER BY soi.product_description_snapshot ASC
      `,
      [salesStatus],
    );
  }
}
