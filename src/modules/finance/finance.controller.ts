import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import { AllocateImportExpenseDto } from './dto/allocate-import-expense.dto';
import { SyncExchangeRatesDto } from './dto/sync-exchange-rates.dto';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('exchange-rates/latest')
  getLatestExchangeRate(
    @Query('base') baseCurrencyCode?: string,
    @Query('quote') quoteCurrencyCode?: string,
  ) {
    return this.financeService.getLatestExchangeRate(
      baseCurrencyCode,
      quoteCurrencyCode,
    );
  }

  @Get('exchange-rates/history')
  findExchangeRateHistory(
    @Query('base') baseCurrencyCode?: string,
    @Query('quote') quoteCurrencyCode?: string,
    @Query('firstDate') firstDate?: string,
    @Query('lastDate') lastDate?: string,
  ) {
    return this.financeService.findExchangeRateHistory(
      baseCurrencyCode,
      quoteCurrencyCode,
      firstDate,
      lastDate,
    );
  }

  @Post('exchange-rates/sync')
  syncExchangeRates(@Body() syncExchangeRatesDto: SyncExchangeRatesDto) {
    return this.financeService.syncExchangeRates(syncExchangeRatesDto);
  }

  @Post('import-expenses/:id/allocations')
  allocateImportExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body() allocateImportExpenseDto: AllocateImportExpenseDto,
  ) {
    return this.financeService.allocateImportExpense(id, allocateImportExpenseDto);
  }

  @Get('import-expenses/:id/allocations')
  findAllocationsByImportExpense(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.findAllocationsByImportExpense(id);
  }

  @Get('inventory-lots/:id/profitability')
  getInventoryLotProfitability(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.getInventoryLotProfitability(id);
  }

  @Get('sales-orders/:id/profitability')
  getSalesOrderProfitability(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.getSalesOrderProfitability(id);
  }
}
