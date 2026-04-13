import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateCustomsEntryDto } from './dto/create-customs-entry.dto';
import { CreateImportExpenseDto } from './dto/create-import-expense.dto';
import { UpdateCustomsEntryStatusDto } from './dto/update-customs-entry-status.dto';
import { CustomsEntry } from './entities/customs-entry.entity';
import { CustomsService } from './customs.service';

@Controller('customs')
export class CustomsController {
  constructor(private readonly customsService: CustomsService) {}

  @Post('entries')
  createCustomsEntry(
    @Body() createCustomsEntryDto: CreateCustomsEntryDto,
  ): Promise<CustomsEntry> {
    return this.customsService.createCustomsEntry(createCustomsEntryDto);
  }

  @Get('entries')
  findAllCustomsEntries(): Promise<CustomsEntry[]> {
    return this.customsService.findAllCustomsEntries();
  }

  @Get('entries/:id')
  findCustomsEntryById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CustomsEntry> {
    return this.customsService.findCustomsEntryById(id);
  }

  @Post('entries/:id/expenses')
  addImportExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body() createImportExpenseDto: CreateImportExpenseDto,
  ): Promise<CustomsEntry> {
    return this.customsService.addImportExpense(id, createImportExpenseDto);
  }

  @Patch('entries/:id/status')
  updateCustomsEntryStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomsEntryStatusDto: UpdateCustomsEntryStatusDto,
  ): Promise<CustomsEntry> {
    return this.customsService.updateCustomsEntryStatus(
      id,
      updateCustomsEntryStatusDto,
    );
  }
}

