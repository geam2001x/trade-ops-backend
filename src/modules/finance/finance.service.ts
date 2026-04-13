import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { ImportExpense } from '../customs/entities/import-expense.entity';
import { InventoryLot } from '../inventory/entities/inventory-lot.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { AllocateImportExpenseDto } from './dto/allocate-import-expense.dto';
import { LandedCostAllocation } from './entities/landed-cost-allocation.entity';

type ImportExpenseAllocationSummary = {
  importExpenseId: number;
  expenseType: string;
  expenseAmountUsd: number;
  allocatedAmountUsd: number;
  remainingAmountUsd: number;
  allocations: Array<{
    id: number;
    inventoryLotId: number;
    lotCode: string;
    allocatedAmountUsd: number;
    allocationMethod: string;
    createdAt: string;
  }>;
};

type InventoryLotProfitability = {
  inventoryLotId: number;
  lotCode: string;
  status: string;
  receivedQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  purchaseUnitCostUsd: number;
  allocatedImportCostUsd: number;
  unitLandedCostUsd: number;
  dispatchedQuantity: number;
  completedQuantity: number;
  dispatchedRevenueUsd: number;
  completedRevenueUsd: number;
  dispatchedCostUsd: number;
  completedCostUsd: number;
  dispatchedGrossMarginUsd: number;
  completedGrossMarginUsd: number;
  completedRoiPercent: number | null;
};

type SalesOrderProfitability = {
  salesOrderId: number;
  orderNumber: string;
  status: string;
  saleType: string;
  orderDate: string;
  quantitySold: number;
  revenueUsd: number;
  costUsd: number;
  grossMarginUsd: number;
  roiPercent: number | null;
  items: Array<{
    salesOrderItemId: number;
    productId: number;
    productDescriptionSnapshot: string;
    quantitySold: number;
    revenueUsd: number;
    costUsd: number;
    grossMarginUsd: number;
  }>;
};

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(LandedCostAllocation)
    private readonly landedCostAllocationsRepository: Repository<LandedCostAllocation>,
    @InjectRepository(ImportExpense)
    private readonly importExpensesRepository: Repository<ImportExpense>,
    @InjectRepository(InventoryLot)
    private readonly inventoryLotsRepository: Repository<InventoryLot>,
    @InjectRepository(SalesOrder)
    private readonly salesOrdersRepository: Repository<SalesOrder>,
    private readonly dataSource: DataSource,
  ) {}

  async allocateImportExpense(
    importExpenseId: number,
    allocateImportExpenseDto: AllocateImportExpenseDto,
  ): Promise<ImportExpenseAllocationSummary> {
    const importExpense = await this.importExpensesRepository.findOne({
      where: {
        id: importExpenseId,
      },
    });

    if (!importExpense) {
      throw new NotFoundException('Import expense not found');
    }

    const seenLots = new Set<number>();
    for (const allocation of allocateImportExpenseDto.allocations) {
      if (seenLots.has(allocation.inventoryLotId)) {
        throw new BadRequestException(
          'The same inventory lot cannot be allocated twice in the same request',
        );
      }
      seenLots.add(allocation.inventoryLotId);
    }

    const currentAllocationTotal = await this.getAllocatedAmountUsd(importExpenseId);
    const requestedAllocationTotal = allocateImportExpenseDto.allocations.reduce(
      (sum, allocation) => sum + allocation.allocatedAmountUsd,
      0,
    );
    const expenseAmountUsd = Number(importExpense.amountUsd);

    if (currentAllocationTotal + requestedAllocationTotal > expenseAmountUsd + 0.0001) {
      throw new BadRequestException(
        'Allocated amount exceeds the available amount for this import expense',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const landedCostAllocationsRepository =
        manager.getRepository(LandedCostAllocation);
      const inventoryLotsRepository = manager.getRepository(InventoryLot);

      for (const allocationInput of allocateImportExpenseDto.allocations) {
        const inventoryLot = await inventoryLotsRepository.findOne({
          where: {
            id: allocationInput.inventoryLotId,
          },
        });

        if (!inventoryLot) {
          throw new NotFoundException(
            `Inventory lot ${allocationInput.inventoryLotId} not found`,
          );
        }

        const lotBelongsToExpense = await this.dataSource.query(
          `
            SELECT il.id
            FROM inventory_lots il
            INNER JOIN shipment_items si ON si.id = il.shipment_item_id
            INNER JOIN customs_entries ce ON ce.shipment_id = si.shipment_id
            WHERE il.id = ? AND ce.id = ?
            LIMIT 1
          `,
          [allocationInput.inventoryLotId, importExpense.customsEntryId],
        );

        if (lotBelongsToExpense.length === 0) {
          throw new BadRequestException(
            `Inventory lot ${allocationInput.inventoryLotId} does not belong to the shipment/customs entry of this import expense`,
          );
        }

        const receivedQuantity = Number(inventoryLot.receivedQuantity);
        if (receivedQuantity <= 0) {
          throw new BadRequestException(
            `Inventory lot ${inventoryLot.id} has an invalid received quantity`,
          );
        }

        const nextAllocatedImportCostUsd =
          Number(inventoryLot.allocatedImportCostUsd) +
          allocationInput.allocatedAmountUsd;
        const nextUnitLandedCostUsd =
          Number(inventoryLot.purchaseUnitCostUsd) +
          nextAllocatedImportCostUsd / receivedQuantity;

        inventoryLot.allocatedImportCostUsd =
          nextAllocatedImportCostUsd.toFixed(4);
        inventoryLot.unitLandedCostUsd = nextUnitLandedCostUsd.toFixed(4);

        await inventoryLotsRepository.save(inventoryLot);

        await landedCostAllocationsRepository.save(
          landedCostAllocationsRepository.create({
            inventoryLotId: allocationInput.inventoryLotId,
            importExpenseId,
            allocatedAmountUsd: allocationInput.allocatedAmountUsd.toFixed(4),
            allocationMethod: allocateImportExpenseDto.allocationMethod,
          }),
        );
      }
    });

    return this.findAllocationsByImportExpense(importExpenseId);
  }

  async findAllocationsByImportExpense(
    importExpenseId: number,
  ): Promise<ImportExpenseAllocationSummary> {
    const importExpense = await this.importExpensesRepository.findOne({
      where: {
        id: importExpenseId,
      },
    });

    if (!importExpense) {
      throw new NotFoundException('Import expense not found');
    }

    const allocations = await this.dataSource.query(
      `
        SELECT
          lca.id,
          lca.inventory_lot_id AS inventoryLotId,
          il.lot_code AS lotCode,
          lca.allocated_amount_usd AS allocatedAmountUsd,
          lca.allocation_method AS allocationMethod,
          lca.created_at AS createdAt
        FROM landed_cost_allocations lca
        INNER JOIN inventory_lots il ON il.id = lca.inventory_lot_id
        WHERE lca.import_expense_id = ?
        ORDER BY lca.id DESC
      `,
      [importExpenseId],
    );

    const allocatedAmountUsd = allocations.reduce(
      (sum: number, allocation: { allocatedAmountUsd: string }) =>
        sum + Number(allocation.allocatedAmountUsd),
      0,
    );

    return {
      importExpenseId: Number(importExpense.id),
      expenseType: importExpense.expenseType,
      expenseAmountUsd: Number(importExpense.amountUsd),
      allocatedAmountUsd: Number(allocatedAmountUsd.toFixed(4)),
      remainingAmountUsd: Number(
        (Number(importExpense.amountUsd) - allocatedAmountUsd).toFixed(4),
      ),
      allocations: allocations.map(
        (allocation: {
          id: number;
          inventoryLotId: number;
          lotCode: string;
          allocatedAmountUsd: string;
          allocationMethod: string;
          createdAt: string;
        }) => ({
          id: Number(allocation.id),
          inventoryLotId: Number(allocation.inventoryLotId),
          lotCode: allocation.lotCode,
          allocatedAmountUsd: Number(allocation.allocatedAmountUsd),
          allocationMethod: allocation.allocationMethod,
          createdAt: allocation.createdAt,
        }),
      ),
    };
  }

  async getInventoryLotProfitability(
    inventoryLotId: number,
  ): Promise<InventoryLotProfitability> {
    const inventoryLot = await this.inventoryLotsRepository.findOne({
      where: {
        id: inventoryLotId,
      },
    });

    if (!inventoryLot) {
      throw new NotFoundException('Inventory lot not found');
    }

    const [profitabilityRow] = await this.dataSource.query(
      `
        SELECT
          COALESCE(SUM(CASE WHEN so.status = 'dispatched' THEN sol.quantity_consumed ELSE 0 END), 0) AS dispatchedQuantity,
          COALESCE(SUM(CASE WHEN so.status = 'completed' THEN sol.quantity_consumed ELSE 0 END), 0) AS completedQuantity,
          COALESCE(SUM(CASE WHEN so.status = 'dispatched' THEN sol.quantity_consumed * soi.unit_price_usd ELSE 0 END), 0) AS dispatchedRevenueUsd,
          COALESCE(SUM(CASE WHEN so.status = 'completed' THEN sol.quantity_consumed * soi.unit_price_usd ELSE 0 END), 0) AS completedRevenueUsd,
          COALESCE(SUM(CASE WHEN so.status = 'dispatched' THEN sol.quantity_consumed * sol.unit_landed_cost_usd_snapshot ELSE 0 END), 0) AS dispatchedCostUsd,
          COALESCE(SUM(CASE WHEN so.status = 'completed' THEN sol.quantity_consumed * sol.unit_landed_cost_usd_snapshot ELSE 0 END), 0) AS completedCostUsd
        FROM sales_order_item_lots sol
        INNER JOIN sales_order_items soi ON soi.id = sol.sales_order_item_id
        INNER JOIN sales_orders so ON so.id = soi.sales_order_id
        WHERE sol.inventory_lot_id = ?
      `,
      [inventoryLotId],
    );

    const dispatchedRevenueUsd = Number(profitabilityRow?.dispatchedRevenueUsd ?? 0);
    const completedRevenueUsd = Number(profitabilityRow?.completedRevenueUsd ?? 0);
    const dispatchedCostUsd = Number(profitabilityRow?.dispatchedCostUsd ?? 0);
    const completedCostUsd = Number(profitabilityRow?.completedCostUsd ?? 0);
    const completedGrossMarginUsd = completedRevenueUsd - completedCostUsd;

    return {
      inventoryLotId: Number(inventoryLot.id),
      lotCode: inventoryLot.lotCode,
      status: inventoryLot.status,
      receivedQuantity: Number(inventoryLot.receivedQuantity),
      availableQuantity: Number(inventoryLot.availableQuantity),
      reservedQuantity: Number(inventoryLot.reservedQuantity),
      purchaseUnitCostUsd: Number(inventoryLot.purchaseUnitCostUsd),
      allocatedImportCostUsd: Number(inventoryLot.allocatedImportCostUsd),
      unitLandedCostUsd: Number(inventoryLot.unitLandedCostUsd),
      dispatchedQuantity: Number(profitabilityRow?.dispatchedQuantity ?? 0),
      completedQuantity: Number(profitabilityRow?.completedQuantity ?? 0),
      dispatchedRevenueUsd,
      completedRevenueUsd,
      dispatchedCostUsd,
      completedCostUsd,
      dispatchedGrossMarginUsd: Number(
        (dispatchedRevenueUsd - dispatchedCostUsd).toFixed(4),
      ),
      completedGrossMarginUsd: Number(completedGrossMarginUsd.toFixed(4)),
      completedRoiPercent:
        completedCostUsd > 0
          ? Number(((completedGrossMarginUsd / completedCostUsd) * 100).toFixed(4))
          : null,
    };
  }

  async getSalesOrderProfitability(
    salesOrderId: number,
  ): Promise<SalesOrderProfitability> {
    const salesOrder = await this.salesOrdersRepository.findOne({
      where: {
        id: salesOrderId,
      },
    });

    if (!salesOrder) {
      throw new NotFoundException('Sales order not found');
    }

    const [summaryRow] = await this.dataSource.query(
      `
        SELECT
          COALESCE(SUM(sol.quantity_consumed), 0) AS quantitySold,
          COALESCE(SUM(sol.quantity_consumed * soi.unit_price_usd), 0) AS revenueUsd,
          COALESCE(SUM(sol.quantity_consumed * sol.unit_landed_cost_usd_snapshot), 0) AS costUsd
        FROM sales_order_items soi
        LEFT JOIN sales_order_item_lots sol ON sol.sales_order_item_id = soi.id
        WHERE soi.sales_order_id = ?
      `,
      [salesOrderId],
    );

    const itemRows = await this.dataSource.query(
      `
        SELECT
          soi.id AS salesOrderItemId,
          soi.product_id AS productId,
          soi.product_description_snapshot AS productDescriptionSnapshot,
          COALESCE(SUM(sol.quantity_consumed), 0) AS quantitySold,
          COALESCE(SUM(sol.quantity_consumed * soi.unit_price_usd), 0) AS revenueUsd,
          COALESCE(SUM(sol.quantity_consumed * sol.unit_landed_cost_usd_snapshot), 0) AS costUsd
        FROM sales_order_items soi
        LEFT JOIN sales_order_item_lots sol ON sol.sales_order_item_id = soi.id
        WHERE soi.sales_order_id = ?
        GROUP BY soi.id, soi.product_id, soi.product_description_snapshot
        ORDER BY soi.id ASC
      `,
      [salesOrderId],
    );

    const revenueUsd = Number(summaryRow?.revenueUsd ?? 0);
    const costUsd = Number(summaryRow?.costUsd ?? 0);
    const grossMarginUsd = revenueUsd - costUsd;

    return {
      salesOrderId: Number(salesOrder.id),
      orderNumber: salesOrder.orderNumber,
      status: salesOrder.status,
      saleType: salesOrder.saleType,
      orderDate: salesOrder.orderDate,
      quantitySold: Number(summaryRow?.quantitySold ?? 0),
      revenueUsd: Number(revenueUsd.toFixed(4)),
      costUsd: Number(costUsd.toFixed(4)),
      grossMarginUsd: Number(grossMarginUsd.toFixed(4)),
      roiPercent:
        costUsd > 0 ? Number(((grossMarginUsd / costUsd) * 100).toFixed(4)) : null,
      items: itemRows.map(
        (item: {
          salesOrderItemId: number;
          productId: number;
          productDescriptionSnapshot: string;
          quantitySold: string;
          revenueUsd: string;
          costUsd: string;
        }) => {
          const itemRevenueUsd = Number(item.revenueUsd);
          const itemCostUsd = Number(item.costUsd);

          return {
            salesOrderItemId: Number(item.salesOrderItemId),
            productId: Number(item.productId),
            productDescriptionSnapshot: item.productDescriptionSnapshot,
            quantitySold: Number(item.quantitySold),
            revenueUsd: Number(itemRevenueUsd.toFixed(4)),
            costUsd: Number(itemCostUsd.toFixed(4)),
            grossMarginUsd: Number((itemRevenueUsd - itemCostUsd).toFixed(4)),
          };
        },
      ),
    };
  }

  private async getAllocatedAmountUsd(importExpenseId: number): Promise<number> {
    const row = await this.landedCostAllocationsRepository
      .createQueryBuilder('allocation')
      .select('COALESCE(SUM(allocation.allocatedAmountUsd), 0)', 'total')
      .where('allocation.importExpenseId = :importExpenseId', {
        importExpenseId,
      })
      .getRawOne<{ total: string }>();

    return Number(row?.total ?? 0);
  }
}
