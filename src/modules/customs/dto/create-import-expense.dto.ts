import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

import { ImportExpenseType } from '../enums/import-expense-type.enum';

export class CreateImportExpenseDto {
  @IsEnum(ImportExpenseType)
  expenseType!: ImportExpenseType;

  @IsDateString()
  expenseDate!: string;

  @IsString()
  @MinLength(3)
  currencyCode!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountOriginal!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.000001)
  exchangeRateToUsd!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountUsd!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

