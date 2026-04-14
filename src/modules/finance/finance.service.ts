import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { ImportExpense } from '../customs/entities/import-expense.entity';
import { InventoryLot } from '../inventory/entities/inventory-lot.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { AllocateImportExpenseDto } from './dto/allocate-import-expense.dto';
import { SyncExchangeRatesDto } from './dto/sync-exchange-rates.dto';
import { ExchangeRateSnapshot } from './entities/exchange-rate-snapshot.entity';
import { LandedCostAllocation } from './entities/landed-cost-allocation.entity';

const BCCH_DEFAULT_SERIES_ID = 'F073.TCO.PRE.Z.D';
const BCCH_PUBLIC_SERIES_URL =
  'https://si3.bcentral.cl/siete/ES/Siete/Cuadro/CAP_TIPO_CAMBIO/MN_TIPO_CAMBIO4/DOLAR_OBS_ADO?idSerie=F073.TCO.PRE.Z.D';
const BCCH_HTTP_TIMEOUT_MS = 60_000;
const BCCH_BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
};
const BANCOESTADO_SIMULATOR_URL =
  'https://www.bancoestado.cl/bancoestado/simulaciones/comercio/simule_1.asp';

const SPANISH_MONTHS: Record<string, string> = {
  ene: '01',
  feb: '02',
  mar: '03',
  abr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  ago: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dic: '12',
};

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

type LatestExchangeRate = {
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: number;
  buyRate: number | null;
  sellRate: number | null;
  rateDate: string;
  sourceName: string;
  sourceUrl: string | null;
  buySellSourceName: string | null;
  buySellSourceUrl: string | null;
  fetchedAt: string;
};

type ExchangeRateHistoryItem = LatestExchangeRate;

type ExchangeRateSyncSummary = {
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  firstDate: string;
  lastDate: string;
  processedCount: number;
  importedCount: number;
  updatedCount: number;
  sourceName: string;
  sourceUrl: string;
  buySellSourceName: string | null;
  buySellSourceUrl: string | null;
};

type NormalizedExchangeRateObservation = {
  date: string;
  rate: number;
  sourceName: string;
  sourceUrl: string;
  buyRate?: number | null;
  sellRate?: number | null;
  buySellSourceName?: string | null;
  buySellSourceUrl?: string | null;
};

function toIsoDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseBcchApiDate(dateString: string) {
  const [day, month, year] = dateString.split('-');
  return `${year}-${month}-${day}`;
}

function parseSpanishObservationDate(
  day: string,
  monthLabel: string,
  year: string,
) {
  const normalizedMonth = SPANISH_MONTHS[monthLabel.toLowerCase()];

  if (!normalizedMonth) {
    throw new Error(`Unsupported BCCh month label: ${monthLabel}`);
  }

  return `${year}-${normalizedMonth}-${day}`;
}

function parseBcchNumber(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return Number.parseFloat(normalized);
}

function parseSlashDate(dateString: string) {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectRepository(LandedCostAllocation)
    private readonly landedCostAllocationsRepository: Repository<LandedCostAllocation>,
    @InjectRepository(ImportExpense)
    private readonly importExpensesRepository: Repository<ImportExpense>,
    @InjectRepository(ExchangeRateSnapshot)
    private readonly exchangeRateSnapshotsRepository: Repository<ExchangeRateSnapshot>,
    @InjectRepository(InventoryLot)
    private readonly inventoryLotsRepository: Repository<InventoryLot>,
    @InjectRepository(SalesOrder)
    private readonly salesOrdersRepository: Repository<SalesOrder>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  @Cron('15 13 * * 1-5', {
    timeZone: 'America/Santiago',
  })
  async handleDailyExchangeRateSync() {
    if (this.configService.get('FX_AUTO_SYNC_ENABLED') !== 'true') {
      return;
    }

    const today = toIsoDateString(new Date());

    try {
      const summary = await this.syncExchangeRates({
        firstDate: today,
        lastDate: today,
      });

      this.logger.log(
        `Exchange rate sync completed: ${summary.processedCount} snapshots processed for ${today}.`,
      );
    } catch (error) {
      this.logger.error(
        `Exchange rate sync failed for ${today}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  async getLatestExchangeRate(
    baseCurrencyCode = 'USD',
    quoteCurrencyCode = 'CLP',
  ): Promise<LatestExchangeRate> {
    const snapshot = await this.exchangeRateSnapshotsRepository.findOne({
      where: {
        baseCurrencyCode: baseCurrencyCode.toUpperCase(),
        quoteCurrencyCode: quoteCurrencyCode.toUpperCase(),
      },
      order: {
        rateDate: 'DESC',
        id: 'DESC',
      },
    });

    if (!snapshot) {
      throw new NotFoundException('Exchange rate snapshot not found');
    }

    return {
      baseCurrencyCode: snapshot.baseCurrencyCode,
      quoteCurrencyCode: snapshot.quoteCurrencyCode,
      rate: Number(snapshot.rate),
      buyRate: snapshot.buyRate ? Number(snapshot.buyRate) : null,
      sellRate: snapshot.sellRate ? Number(snapshot.sellRate) : null,
      rateDate: snapshot.rateDate.toISOString(),
      sourceName: snapshot.sourceName,
      sourceUrl: snapshot.sourceUrl,
      buySellSourceName: snapshot.buySellSourceName,
      buySellSourceUrl: snapshot.buySellSourceUrl,
      fetchedAt: snapshot.fetchedAt.toISOString(),
    };
  }

  async findExchangeRateHistory(
    baseCurrencyCode = 'USD',
    quoteCurrencyCode = 'CLP',
    firstDate?: string,
    lastDate?: string,
  ): Promise<ExchangeRateHistoryItem[]> {
    const normalizedBase = baseCurrencyCode.toUpperCase();
    const normalizedQuote = quoteCurrencyCode.toUpperCase();

    const query = this.exchangeRateSnapshotsRepository
      .createQueryBuilder('snapshot')
      .where('snapshot.baseCurrencyCode = :baseCurrencyCode', {
        baseCurrencyCode: normalizedBase,
      })
      .andWhere('snapshot.quoteCurrencyCode = :quoteCurrencyCode', {
        quoteCurrencyCode: normalizedQuote,
      });

    if (firstDate) {
      query.andWhere('DATE(snapshot.rateDate) >= :firstDate', {
        firstDate,
      });
    }

    if (lastDate) {
      query.andWhere('DATE(snapshot.rateDate) <= :lastDate', {
        lastDate,
      });
    }

    const snapshots = await query
      .orderBy('snapshot.rateDate', 'DESC')
      .addOrderBy('snapshot.id', 'DESC')
      .getMany();

    return snapshots.map((snapshot) => ({
      baseCurrencyCode: snapshot.baseCurrencyCode,
      quoteCurrencyCode: snapshot.quoteCurrencyCode,
      rate: Number(snapshot.rate),
      buyRate: snapshot.buyRate ? Number(snapshot.buyRate) : null,
      sellRate: snapshot.sellRate ? Number(snapshot.sellRate) : null,
      rateDate: snapshot.rateDate.toISOString(),
      sourceName: snapshot.sourceName,
      sourceUrl: snapshot.sourceUrl,
      buySellSourceName: snapshot.buySellSourceName,
      buySellSourceUrl: snapshot.buySellSourceUrl,
      fetchedAt: snapshot.fetchedAt.toISOString(),
    }));
  }

  async syncExchangeRates(
    syncExchangeRatesDto: SyncExchangeRatesDto,
  ): Promise<ExchangeRateSyncSummary> {
    const baseCurrencyCode = (
      syncExchangeRatesDto.baseCurrencyCode ?? 'USD'
    ).toUpperCase();
    const quoteCurrencyCode = (
      syncExchangeRatesDto.quoteCurrencyCode ?? 'CLP'
    ).toUpperCase();
    const firstDate =
      syncExchangeRatesDto.firstDate ?? toIsoDateString(new Date());
    const lastDate = syncExchangeRatesDto.lastDate ?? firstDate;

    if (baseCurrencyCode !== 'USD' || quoteCurrencyCode !== 'CLP') {
      throw new BadRequestException(
        'Only USD/CLP sync is implemented for the official BCCh source',
      );
    }

    if (firstDate > lastDate) {
      throw new BadRequestException('firstDate cannot be greater than lastDate');
    }

    const observations = await this.fetchUsdClpObservedSeries(
      firstDate,
      lastDate,
    );

    let importedCount = 0;
    let updatedCount = 0;

    for (const observation of observations) {
      const [existingSnapshot] = await this.dataSource.query(
        `
          SELECT id
          FROM exchange_rate_snapshots
          WHERE base_currency_code = ?
            AND quote_currency_code = ?
            AND DATE(rate_date) = ?
          LIMIT 1
        `,
        [baseCurrencyCode, quoteCurrencyCode, observation.date],
      );

      await this.dataSource.query(
        `
          INSERT INTO exchange_rate_snapshots (
            base_currency_code,
            quote_currency_code,
            rate,
            buy_rate,
            sell_rate,
          rate_date,
          source_name,
          source_url,
          buy_sell_source_name,
          buy_sell_source_url
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            rate = VALUES(rate),
            buy_rate = VALUES(buy_rate),
            sell_rate = VALUES(sell_rate),
            source_name = VALUES(source_name),
            source_url = VALUES(source_url),
            buy_sell_source_name = VALUES(buy_sell_source_name),
            buy_sell_source_url = VALUES(buy_sell_source_url)
        `,
        [
          baseCurrencyCode,
          quoteCurrencyCode,
          observation.rate.toFixed(6),
          observation.buyRate ? observation.buyRate.toFixed(6) : null,
          observation.sellRate ? observation.sellRate.toFixed(6) : null,
          `${observation.date} 12:00:00`,
          observation.sourceName,
          observation.sourceUrl,
          observation.buySellSourceName ?? null,
          observation.buySellSourceUrl ?? null,
        ],
      );

      if (existingSnapshot) {
        updatedCount += 1;
      } else {
        importedCount += 1;
      }
    }

    return {
      baseCurrencyCode,
      quoteCurrencyCode,
      firstDate,
      lastDate,
      processedCount: observations.length,
      importedCount,
      updatedCount,
      sourceName: observations[0]?.sourceName ?? 'BCCh',
      sourceUrl: observations[0]?.sourceUrl ?? BCCH_PUBLIC_SERIES_URL,
      buySellSourceName: observations.find(
        (observation) => observation.buySellSourceName,
      )?.buySellSourceName ?? null,
      buySellSourceUrl: observations.find(
        (observation) => observation.buySellSourceUrl,
      )?.buySellSourceUrl ?? null,
    };
  }

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

  private async fetchUsdClpObservedSeries(
    firstDate: string,
    lastDate: string,
  ): Promise<NormalizedExchangeRateObservation[]> {
    const bcchUser = this.configService.get<string>('FX_BCCH_USER');
    const bcchPass = this.configService.get<string>('FX_BCCH_PASS');
    let observations: NormalizedExchangeRateObservation[];

    if (bcchUser && bcchPass) {
      observations = await this.fetchUsdClpObservedSeriesFromApi(
        bcchUser,
        bcchPass,
        firstDate,
        lastDate,
      );
    } else {
      observations = await this.fetchUsdClpObservedSeriesFromPublicPage(
        firstDate,
        lastDate,
      );
    }

    return this.enrichWithBancoEstadoBuySell(observations);
  }

  private async fetchUsdClpObservedSeriesFromApi(
    user: string,
    pass: string,
    firstDate: string,
    lastDate: string,
  ): Promise<NormalizedExchangeRateObservation[]> {
    const seriesId =
      this.configService.get<string>('FX_BCCH_SERIES_ID') ??
      BCCH_DEFAULT_SERIES_ID;
    const params = new URLSearchParams({
      user,
      pass,
      firstdate: firstDate,
      lastdate: lastDate,
      timeseries: seriesId,
      function: 'GetSeries',
    });

    const response = await this.fetchBcchResource(
      `https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx?${params.toString()}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new BadRequestException(
        `BCCh API request failed with status ${response.status}`,
      );
    }

    const payload = (await response.json()) as {
      Codigo: number;
      Descripcion: string;
      Series?: {
        Obs?: Array<{
          indexDateString: string;
          value: string;
          statusCode: string;
        }>;
      };
    };

    if (payload.Codigo !== 0) {
      throw new BadRequestException(
        `BCCh API error: ${payload.Descripcion ?? 'unknown error'}`,
      );
    }

    return (payload.Series?.Obs ?? [])
      .filter((observation) => observation.statusCode === 'OK')
      .map((observation) => ({
        date: parseBcchApiDate(observation.indexDateString),
        rate: Number.parseFloat(observation.value),
        sourceName: 'BCCh API BDE',
        sourceUrl:
          'https://si3.bcentral.cl/estadisticas/Principal1/Web_Services/doc_es.htm',
      }));
  }

  private async fetchUsdClpObservedSeriesFromPublicPage(
    firstDate: string,
    lastDate: string,
  ): Promise<NormalizedExchangeRateObservation[]> {
    const response = await this.fetchBcchResource(BCCH_PUBLIC_SERIES_URL, {
      headers: BCCH_BROWSER_HEADERS,
    });

    if (!response.ok) {
      throw new BadRequestException(
        `BCCh public page request failed with status ${response.status}`,
      );
    }

    const html = await response.text();
    const regex =
      /<tr>\s*<td>\s*(\d{2})\.([A-Za-zÁÉÍÓÚáéíóú]{3})\.(\d{4})\s*<\/td>\s*<td>\s*([\d\.,]+)\s*<\/td>\s*<\/tr>/g;
    const observations = new Map<string, NormalizedExchangeRateObservation>();

    let match: RegExpExecArray | null = regex.exec(html);
    while (match) {
      const [, day, monthLabel, year, rawValue] = match;
      const observationDate = parseSpanishObservationDate(day, monthLabel, year);

      if (observationDate >= firstDate && observationDate <= lastDate) {
        observations.set(observationDate, {
          date: observationDate,
          rate: parseBcchNumber(rawValue),
          sourceName: 'BCCh BDE public page',
          sourceUrl: BCCH_PUBLIC_SERIES_URL,
        });
      }

      match = regex.exec(html);
    }

    if (observations.size === 0) {
      throw new BadRequestException(
        'BCCh public page returned no observations for the requested date range',
      );
    }

    return [...observations.values()].sort((left, right) =>
      left.date.localeCompare(right.date),
    );
  }

  private async enrichWithBancoEstadoBuySell(
    observations: NormalizedExchangeRateObservation[],
  ): Promise<NormalizedExchangeRateObservation[]> {
    if (observations.length === 0) {
      return observations;
    }

    try {
      const bancoEstadoQuote = await this.fetchBancoEstadoUsdClpQuote();

      return observations.map((observation) => {
        if (observation.date !== bancoEstadoQuote.date) {
          return observation;
        }

        return {
          ...observation,
          buyRate: bancoEstadoQuote.buyRate,
          sellRate: bancoEstadoQuote.sellRate,
          buySellSourceName: bancoEstadoQuote.buySellSourceName,
          buySellSourceUrl: bancoEstadoQuote.buySellSourceUrl,
        };
      });
    } catch (error) {
      this.logger.warn(
        `BancoEstado buy/sell quote could not be fetched: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );

      return observations;
    }
  }

  private async fetchBancoEstadoUsdClpQuote(): Promise<
    Required<
      Pick<
        NormalizedExchangeRateObservation,
        'date' | 'buyRate' | 'sellRate' | 'buySellSourceName' | 'buySellSourceUrl'
      >
    >
  > {
    const response = await this.fetchBcchResource(BANCOESTADO_SIMULATOR_URL, {
      headers: BCCH_BROWSER_HEADERS,
    });

    if (!response.ok) {
      throw new BadRequestException(
        `BancoEstado simulator request failed with status ${response.status}`,
      );
    }

    const html = await response.text();
    const clientBuyMatch = html.match(
      /compra-dolares"\)\.checked == true\)\{\s*TotalValor = sinpunto \* ([0-9]+(?:\.[0-9]+)?);/i,
    );
    const clientSellMatch = html.match(
      /venta-dolares"\)\.checked == true\)\{\s*TotalValor = sinpunto \* ([0-9]+(?:\.[0-9]+)?);/i,
    );
    const dateMatch = html.match(
      /document\.getElementById\("Fecha"\)\.value = "(\d{2}\/\d{2}\/\d{4})";/i,
    );

    if (!clientBuyMatch || !clientSellMatch || !dateMatch) {
      throw new BadRequestException(
        'BancoEstado simulator returned an unsupported HTML structure',
      );
    }

    return {
      date: parseSlashDate(dateMatch[1]),
      buyRate: Number.parseFloat(clientSellMatch[1]),
      sellRate: Number.parseFloat(clientBuyMatch[1]),
      buySellSourceName: 'BancoEstado simulador compra/venta USD',
      buySellSourceUrl: BANCOESTADO_SIMULATOR_URL,
    };
  }

  private async fetchBcchResource(
    url: string,
    init?: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BCCH_HTTP_TIMEOUT_MS);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BadRequestException(
          `BCCh request timed out after ${BCCH_HTTP_TIMEOUT_MS / 1000} seconds`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
