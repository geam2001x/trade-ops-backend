import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';

import { AllocateImportExpenseDto } from './dto/allocate-import-expense.dto';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

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
