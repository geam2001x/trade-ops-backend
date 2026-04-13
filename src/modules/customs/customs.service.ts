import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Shipment } from '../shipments/entities/shipment.entity';
import { CreateCustomsEntryDto } from './dto/create-customs-entry.dto';
import { CreateImportExpenseDto } from './dto/create-import-expense.dto';
import { UpdateCustomsEntryStatusDto } from './dto/update-customs-entry-status.dto';
import { CustomsEntryStatus } from './enums/customs-entry-status.enum';
import { CustomsEntry } from './entities/customs-entry.entity';
import { ImportExpense } from './entities/import-expense.entity';

@Injectable()
export class CustomsService {
  constructor(
    @InjectRepository(CustomsEntry)
    private readonly customsEntriesRepository: Repository<CustomsEntry>,
    @InjectRepository(ImportExpense)
    private readonly importExpensesRepository: Repository<ImportExpense>,
    @InjectRepository(Shipment)
    private readonly shipmentsRepository: Repository<Shipment>,
  ) {}

  async createCustomsEntry(
    createCustomsEntryDto: CreateCustomsEntryDto,
  ): Promise<CustomsEntry> {
    const shipment = await this.shipmentsRepository.findOne({
      where: {
        id: createCustomsEntryDto.shipmentId,
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const customsEntry = this.customsEntriesRepository.create({
      shipmentId: createCustomsEntryDto.shipmentId,
      entryNumber: createCustomsEntryDto.entryNumber,
      arrivalDateChile: createCustomsEntryDto.arrivalDateChile ?? null,
      clearanceDate: createCustomsEntryDto.clearanceDate ?? null,
      status: createCustomsEntryDto.status ?? CustomsEntryStatus.PENDING,
      notes: createCustomsEntryDto.notes ?? null,
    });

    const savedCustomsEntry = await this.customsEntriesRepository.save(customsEntry);
    return this.findCustomsEntryById(Number(savedCustomsEntry.id));
  }

  async findAllCustomsEntries(): Promise<CustomsEntry[]> {
    return this.customsEntriesRepository.find({
      relations: {
        expenses: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findCustomsEntryById(id: number): Promise<CustomsEntry> {
    const customsEntry = await this.customsEntriesRepository.findOne({
      where: {
        id,
      },
      relations: {
        expenses: true,
      },
    });

    if (!customsEntry) {
      throw new NotFoundException('Customs entry not found');
    }

    return customsEntry;
  }

  async addImportExpense(
    customsEntryId: number,
    createImportExpenseDto: CreateImportExpenseDto,
  ): Promise<CustomsEntry> {
    await this.findCustomsEntryById(customsEntryId);

    const expense = this.importExpensesRepository.create({
      customsEntryId,
      expenseType: createImportExpenseDto.expenseType,
      expenseDate: createImportExpenseDto.expenseDate,
      currencyCode: createImportExpenseDto.currencyCode,
      amountOriginal: createImportExpenseDto.amountOriginal.toFixed(4),
      exchangeRateToUsd: createImportExpenseDto.exchangeRateToUsd.toFixed(6),
      amountUsd: createImportExpenseDto.amountUsd.toFixed(4),
      notes: createImportExpenseDto.notes ?? null,
    });

    await this.importExpensesRepository.save(expense);

    return this.findCustomsEntryById(customsEntryId);
  }

  async updateCustomsEntryStatus(
    id: number,
    updateCustomsEntryStatusDto: UpdateCustomsEntryStatusDto,
  ): Promise<CustomsEntry> {
    await this.findCustomsEntryById(id);

    await this.customsEntriesRepository.update(
      { id },
      {
        status: updateCustomsEntryStatusDto.status,
        notes: updateCustomsEntryStatusDto.notes ?? null,
      },
    );

    return this.findCustomsEntryById(id);
  }
}

